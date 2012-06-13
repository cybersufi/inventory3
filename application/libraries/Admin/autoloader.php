<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

function __autoload($class_name) {
    //$class_name = str_replace('-', '', $class_name);
    $rdir = APPPATH.'/libraries/Admin/';
    $dirs = array('Include/','Include/Exception/', 'Include/User/');
    
    foreach ($dirs as $dir) {
        if (file_exists($rdir.$dir.$class_name.'.php')) {
            include_once $rdir.$dir.$class_name.'.php';
            return;
        }
    }
}

?>