<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class dashboard extends CI_Controller {
	
	private $sitename = "";
	
	private $index;
	private $result;
	
	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		$this->sitename = $this->CI->config->item('site_name');
		$this->load->library('admin');
		$this->index = 'administrator/dashboard/index';
		$this->result = 'administrator/dashboard/result';
	}
	
	public function index() {
		$this->load->view('welcome_message');
	}
	
	public function topUser() {
		$data['type'] = 'list';
		$data['funcname'] = 'tlist';
		$data['res'] = null;
		$data['total'] = 0;
		
		//$issiteadmin = $this->session->userdata('issiteadmin');
		//if ($issiteadmin) {
			$this->load->model('administrator/dashboardmodel','dm');
			$sl = $this->dm->getTopUser();
	    	$data['type'] = 'list';
			$data['funcname'] = 'tlist';
	    	$data['res'] = $sl->result();
	    	$data['total'] = $sl->num_rows();
		//}
    	$this->load->view($this->result, $data);
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