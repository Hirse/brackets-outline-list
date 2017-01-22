<?php
abstract class BaseAdapter {
    protected function __construct() {
        $this->db_link = new PDOWrapper (
            Config::DBMS,
            Config::DBMS_HOST,
            Config::DBMS_PORT,
            Config::APP_DB_USER,
            Config::APP_DB_USER_PASS,
            Config::APP_DB
        );
    }
    abstract public function insertAlias($alias, $ormizer_id, $referenced_table);

    abstract protected function castColumns($columns_array);
}
?>