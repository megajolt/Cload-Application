#!/bin/bash

#
# This is a script for launching a 3-node group replication cluster of MySQL
# servers running in Docker containers.  When running this script, the following
# environment variable must be set (the script will *not* read environment
# variables from the .env file):
#
#   MYSQL_ROOT_PASSWORD - This will be the password assigned to the root user
#     for all three nodes in the cluster.
#
# In addition, the following environment variables may be set:
#
#   MYSQL_PORT - If this is set, it will be the host machine port to which to
#     publish port 3306 of the Docker container running the primary MySQL
#     server.  In other words, this will represent the host machine port
#     through which a connection can be made to the primary MySQL server.  If
#     this is not specified, a default value of 3306 is used.
#
#   MYSQL_DATABASE - If this is set, it specifies the name of a new database
#     that will be created within all of three nodes.
#
#   MYSQL_USER and MYSQL_PASSWORD - If both of these are set, a new MySQL user
#     is created on all three nodes with these credentials.  The user is given
#     access to the database with name MYSQL_DATABASE if it is specified.
#
# After the script runs, the following three Docker containers will be started:
#   mysql-s1 - This will be the primary node in the group replication cluster.
#   mysql-s2 - This will be a secondary node.
#   mysql-s3 - This will be a secondary node.
#

#
# Figure out the directory in which this script lives.
#
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

#
# First, create a Docker network over which the three nodes can be connected.
#
network_name="mysql-rpl-net"
echo "== Creating Docker network $network_name"
docker network create "$network_name"
echo

#
# Create a Docker volume for each node.  This volume will be used to store the
# database data inserted into the node.
#
echo "== Creating Docker volumes:"
for n in {1..3}; do
  volume_name="mysql-s${n}-volume"
  docker volume create "$volume_name"
done
echo

#
# Perform an initial launch of each MySQL container to force it to initialize
# its database into the Docker volume created above.  The containers are then
# shut down and removed.  Once the database is initialized in a Docker volume,
# that volume can be re-attached to a new MySQL container to "trick" that
# container into skipping the database initialization.  This allows us to load
# MySQL plugins during database setup, which we normally can't do because it
# is disabled for the database initialization step.
#
# See this GitHub issue for more info on this approach:
#
#   https://github.com/docker-library/mysql/issues/977
#
echo "== First initialization of MySQL containers"
for n in {1..3}; do
  container_name="mysql-s${n}"
  volume_name="mysql-s${n}-volume"
  echo "$container_name"
  docker run -d --name "$container_name"              \
    --network "$network_name"                         \
    -v "${volume_name}:/var/lib/mysql"                \
    -e "MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}"   \
    mysql
  sleep 10
  docker stop "$container_name"
  docker rm "$container_name"
done
echo

#
# Launch all containers for real.  This time when launching the container, a
# MySQL config file is mounted into an appropriate location to specify the
# configuration options needed to set up group replication.  Config files are
# in the conf/ directory besite this script.
#
echo "== Starting up MySQL containers with configuration"
for n in {1..3}; do
  container_name="mysql-s${n}"
  volume_name="mysql-s${n}-volume"

  #
  # Node #1 will serve as the primary node in the group.  For node #1 only, we
  # will publish the MySQL port (3306) to a port on the host machine, so we can
  # easily communicate with its MySQL server.
  #
  publish_argument=""
  if [ "$n" -eq 1 ]; then
    publish_argument="-p ${MYSQL_PORT:-3306}:3306"
  fi

  echo "$container_name"
  docker run -d --name "$container_name" $publish_argument                  \
    --network "$network_name"                                               \
    -v "${volume_name}:/var/lib/mysql"                                      \
    -v "${SCRIPT_DIR}/conf/${container_name}.cnf:/etc/mysql/conf.d/my.cnf"  \
    -e "MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}"                         \
    mysql
done
echo

#
# Run two sets of SQL commands against the primary node.  The first set of
# commands sets up the user that will be used to perform replication between
# the nodes.  The second set of commands will bootstrap (i.e. launch) group
# replication.  Commands are encoded in .sql files in the init/ directory
# beside this script.
#
echo "== Initializing primary"
sleep 5
docker exec -i mysql-s1 mysql -uroot -p${MYSQL_ROOT_PASSWORD} < "${SCRIPT_DIR}/init/repl-user-create.sql"
docker exec -i mysql-s1 mysql -uroot -p${MYSQL_ROOT_PASSWORD} < "${SCRIPT_DIR}/init/bootstrap-group.sql"
echo

#
# Run two sets of SQL commands against each of the secondary nodes.  The first
# set of commands sets up the user that will be used to perform replication
# between the nodes.  The second set of commands joins the secondary into the
# group.  Commands are encoded in .sql files in the init/ directory beside this
# script.
#
echo "== Initializing secondaries"
for n in {2..3}; do
  container_name="mysql-s${n}"
  docker exec -i "${container_name}" mysql -uroot -p${MYSQL_ROOT_PASSWORD} < "${SCRIPT_DIR}/init/repl-user-create.sql"
  docker exec -i "${container_name}" mysql -uroot -p${MYSQL_ROOT_PASSWORD} < "${SCRIPT_DIR}/init/join-group.sql"
done

#
# If the environment variable MYSQL_DATABASE is specified, create a database
# with the specified name on the primary node.  Replication should copy this
# database to the other nodes.  Inspired by the official MySQL Docker image's
# setup code:
#
#   https://github.com/docker-library/mysql/blob/c05422492215b3f0602409288c868ee4fd606ac3/8.4/docker-entrypoint.sh#L307-L310
#
if [ -n "$MYSQL_DATABASE" ]; then
  echo "== Creating database $MYSQL_DATABASE"
  docker exec mysql-s1 mysql -uroot -p${MYSQL_ROOT_PASSWORD} \
    -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` ;"
fi

#
# If the environment variables MYSQL_USER and MYSQL_PASSWORD are specified,
# create a user with the specified credentials on the primary node.  Give the
# new user permissions on the database specified by MYSQL_DATABASE if present.
# Replication should copy this user to the other nodes.  Inspired by the
# official MySQL Docker image's setup code:
#
#   https://github.com/docker-library/mysql/blob/c05422492215b3f0602409288c868ee4fd606ac3/8.4/docker-entrypoint.sh#L312-L320
#
if [ -n "$MYSQL_USER" ] && [ -n "$MYSQL_PASSWORD" ]; then
  echo "== Creating user $MYSQL_USER"
  docker exec mysql-s1 mysql -uroot -p${MYSQL_ROOT_PASSWORD} \
    -e "CREATE USER '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD' ;"
  if [ -n "$MYSQL_DATABASE" ]; then
    echo "== Giving user $MYSQL_USER access to database $MYSQL_DATABASE"
    docker exec mysql-s1 mysql -uroot -p${MYSQL_ROOT_PASSWORD} \
      -e "GRANT ALL ON \`${MYSQL_DATABASE//_/\\_}\`.* TO '$MYSQL_USER'@'%' ;"
  fi
fi
