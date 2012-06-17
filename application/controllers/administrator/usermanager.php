<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class usermanager extends CI_Controller {
	
	private $result = "";
	
	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		$this->sitename = $this->CI->config->item('site_name');
		$this->load->library('admin');
		$this->index = 'administrator/user/index';
		$this->result = 'administrator/user/result';
	}
	
	public function index() {
		$this->load->view('administrator/main');
	}
	
	public function getList() {
		$data['timingStart'] = microtime(true);
		
		//$issiteadmin = $this->session->userdata('issiteadmin');
		//if ($issiteadmin) {
			$start = $this->input->get_post('start');
	    	$limit = $this->input->get_post('limit');
	    	$filters = $this->input->get_post('filter');
			$sort = $this->input->get_post('sort');
	    	$isFiltered = false;
			$isSorted = false;
	    	$collection = "";
	    	
		    if (!empty($filters)) {
		      	$isFiltered = true;
		      	$filters = $this->filterParser($filters);
		    }
			
			if (!empty($sort)) {
				$isSorted = true;
				$sort = $this->sortParser($sort);
			} else {
				$sort = NULL;
			}
	    	
			$start = empty($start) ? 0 : $start;
			$limit = empty($limit) ? 0 : $limit;
			$filters = ($isFiltered) ? $filters : NULL;
			$sort = ($isSorted) ? $sort : NULL;
			
			$this->load->model('administrator/usermodel','um');
			$collection = $this->um->getUserList($start, $limit, $sort, $filters);
			
	    	/*$data['type'] = 'list';
			$data['funcname'] = 'ulist';
	    	$data['res'] = $sl->result();
	    	$data['total'] = ($isFiltered) ? $this->um->getUserCount($filters) : $this->um->getUserCount();*/
	    	
	    	$res['data'] = ($collection) ? $collection->toArray() : array();
			$res['totalCount'] = $this->um->userCount($filters);
			$data['status'] = 'ok';
			$data['success'] = true;
			$data['result'] = $res;
		//}
    	$this->load->view($this->result, $data);
	}
	
}

?>