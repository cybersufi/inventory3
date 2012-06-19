<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class dashboard extends CI_Controller {
	
	private $sitename = "";
	private $index;
	private $result;
	private $timming;
	
	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		$this->sitename = $this->CI->config->item('site_name');
		$this->load->library('admin');
		$this->index = 'administrator/dashboard/index';
		$this->result = 'administrator/dashboard/result';
		$this->timming = microtime(true);
	}
	
	public function index() {
		$data['page_title'] = 'Dashboard Controller';
		$data['function_list'] = array(
			array(
				'function_name' => 'topUser()',
				'function_desc' => 'Function to get top user list',
				'function_param' => array(),
				'function_return' => array(
					'object' => 'UserCollection', 
					'desc' => 'return user list in form of UserCollection object otherwise null is no user return'
				)
			),
			array(
				'function_name' => 'loggedUser ()',
				'function_desc' => 'Function to get currently logged user',
				'function_param' => array(),
				'function_return' => array(
					'object' => 'UserCollection',
					'desc' => 'return user list in form of UserCollection object otherwise null is no user return'
				)
			),
			array(
				'function_name' => 'topIP ()',
				'function_desc' => 'Function to get top IP list',
				'function_param' => array(),
				'function_return' => array()
			),
		);
		$this->load->view('default', $data);
	}
	
	public function topUser() {
		$data['timingStart'] = $this->timming;
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
		$data['timingStart'] = $this->timming;
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
	
	public function hitData() {
		return null;
	}
	
	public function topIP() {
		return null;
	}
}

?>