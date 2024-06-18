#!/bin/bash

#
# This script undoes everything that is done by the `start-group.sh` script
# to destroy all Docker components repated to the replication group, including
# the Docker network, all Docker volumes, and all Docker containers.
#

echo "== Destroying MySQL containers and volumes"
for n in {1..3}; do
  container_name="mysql-s${n}"
  volume_name="mysql-s${n}-volume"
  docker container stop "$container_name"
  docker container rm "$container_name"
  docker volume rm "$volume_name"
done
echo

echo "== Destroying Docker network"
network_name="mysql-rpl-net"
docker network rm "$network_name"
echo
