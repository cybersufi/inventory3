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
		$data['timingStart'] = microtime(true);
		//$issiteadmin = $this->session->userdata('issiteadmin');
		//if ($issiteadmin) {
			$this->load->model('administrator/dashboardmodel','dm');
			$sl = $this->dm->getTopUser();
			$res['data'] = ($sl) ? $sl->toArray() : array();
			$res['totalCount'] = ($sl) ? $sl->count() : 0;
			$data['status'] = 'ok';
			$data['success'] = true;
			$data['result'] = $res;
		//}
    	$this->load->view($this->result, $data);
	}
	
	public function loggedUser() {
		$data['timingStart'] = microtime(true);
		
		//$issiteadmin = $this->session->userdata('issiteadmin');
		//if ($issiteadmin) {
			$this->load->model('administrator/dashboardmodel','dm');
			$sl = $this->dm->getLoggedUser();
			$res['data'] = ($sl) ? $sl->toArray() : array();
			$res['totalCount'] = ($sl) ? $sl->count() : 0;
			$data['status'] = 'ok';
			$data['success'] = true;
			$data['result'] = $res;
		//}
    	$this->load->view($this->result, $data);
		return null;
	}
	
	public function topIP() {
		return null;
	}
}

?>