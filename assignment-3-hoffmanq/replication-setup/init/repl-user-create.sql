--
-- This file contains SQL commands to set up a MySQL user to be used to
-- perform replication between nodes.  These commands are executed on all nodes
-- in the replication group.  See this page from the MySQL docs for more info:
--
-- https://dev.mysql.com/doc/refman/8.0/en/group-replication-user-credentials.html
--
-- Note that the replication user's password is hard-coded here.  Not the best
-- from a security perspective, but fine for demonstration purposes.
--
SET SQL_LOG_BIN=0;
CREATE USER rpl_user@'%' IDENTIFIED BY 'hunter2';
GRANT REPLICATION SLAVE ON *.* TO rpl_user@'%';
GRANT CONNECTION_ADMIN ON *.* TO rpl_user@'%';
GRANT BACKUP_ADMIN ON *.* TO rpl_user@'%';
GRANT GROUP_REPLICATION_STREAM ON *.* TO rpl_user@'%';
FLUSH PRIVILEGES;
SET SQL_LOG_BIN=1;
CHANGE REPLICATION SOURCE TO SOURCE_USER='rpl_user', SOURCE_PASSWORD='hunter2' FOR CHANNEL 'group_replication_recovery';
