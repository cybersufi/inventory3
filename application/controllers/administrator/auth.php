<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class Auth extends CI_Controller {
	
	private $sitename = "";
	
	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		$this->sitename = $this->CI->config->item('site_name');
		$this->load->library('admin');
		$this->load->library('libauth');
	}
	
	public function index() {
		$this->load->view('welcome_message');
	}
	
	public function login() {
		$sess_id = $this->session->userdata('id');
		$data = array();
		$data['base_url'] = base_url();
		if (empty($sess_id)) {
			$user = $this->input->getJsonParameter('username');
			$pass = $this->decrypt($this->input->getJsonParameter('password'));	
			if ((strlen($user) > 0) && (strlen($pass) > 0)) {
				try {
					$res = $this->libauth->login($user,$pass);	
					
					$data['status'] = 'ok';
					$data['success'] = true;
					$data['result'] = $res;
					
				} catch (SerializableException $e) {
					$e->setDetail($this->decrypt($this->input->post('password')));
					$data['status'] = 'error';
					$data['success'] = false;
					$data['result'] = $e->serialize();
					
				}
			} else {
				$e = new InvalidLoginDataException();
				$e->setDetail($pass);
				$data['status'] = 'error';
				$data['success'] = false;
				$data['result'] = $e->serialize();
			}
		} else {
			$e = new UserAlreadySignedInException();
			$data['status'] = 'error';
			$data['success'] = false;
			$data['result'] = $e->serialize();
		}

		$this->load->view('administrator/result', $data);
	}
	
	public function doLogout() {
		
	}
	
	private function decrypt($str) {
		$str = str_replace(".", "=", $str);
		for($i=0; $i<5;$i++) {
			$str=base64_decode(strrev($str));
	  	}
	  	return $str;
	}
}

?>