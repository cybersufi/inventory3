<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class dashboard extends CI_Controller {
	
	private $sitename = "";
	
	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		$this->sitename = $this->CI->config->item('site_name');
		$this->load->library('admin');
	}
	
	public function index() {
		$this->load->view('welcome_message');
	}
	
	public function topUser() {
		return null;
	}
	
	public function loggedUser() {
		return null;
	}
	
	public function topIP() {
		return null;
	}
}

?>