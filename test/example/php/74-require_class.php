<?php
require_once('includes/conf.php');
require_once('includes/class.db.php');

define('LOGS_TABLE', 'logs');

class LogHelper {
    private $db = new DB();
    public static function LogToDB($param1, $param2, $param3, $param4) {
        $data = array('column1'=>$param1, 'column2'=>$param2, 'column3'=>$param3, 'column4'=>$param4);
        return $db->insert(LOGS_TABLE, $data);
    }
}
?>