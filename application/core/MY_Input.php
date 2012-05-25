<?php  
if(!defined('BASEPATH')) exit('No direct script access allowed');

class MY_Input extends CI_Input {
	
	private $params = '';
	
	function __construct() {
		parent::__construct();
		$this->parseJsonData();
	}
	
	private function parseJsonData() {
		$this->params = (isset($_REQUEST['data'])) ? json_decode($_REQUEST['data'], true) : null;

        if (isset($_REQUEST['data'])) {
            $$this->params =  json_decode($_REQUEST['data'], true);
        } else {
            $raw  = '';
            $httpContent = fopen('php://input', 'r');
            while ($kb = fread($httpContent, 1024)) {
                $raw .= $kb;
            }
            $tmp_params = json_decode($raw, true);
            if ($tmp_params) {
                $this->params = $tmp_params;
            }
        }
	}
	
	private function hasParameter ($name) {
		if (array_key_exists($name, $this->params)) {
			return true; 
		} else {
			return false;
		}
	} 
	
	public function getJsonParameter ($name, $default = null) {
		if (!$this->hasParameter($name)) {
			return $default;
		} else {
			return $this->params[$name];
		}
	}
	
	public function getJsonParameters () {
		return $this->params;
	}
}
