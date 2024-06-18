--
-- This file contains SQL commands to bootstrap the replication group.  These
-- commands are only executed on the primary node in the group.  See this
-- page from the MySQL docs for more info:
--
-- https://dev.mysql.com/doc/refman/8.0/en/group-replication-bootstrap.html
--
SET GLOBAL group_replication_bootstrap_group=ON;
START GROUP_REPLICATION;
SET GLOBAL group_replication_bootstrap_group=OFF;
