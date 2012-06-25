<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class Rolemanager extends CI_Controller {

	private $timingStart="";

	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		//$this->load->library('acl');
		$this->index = 'administrator/role/index';
		$this->result = 'administrator/result';
		$this->timingStart = microtime(true);
	}

	public function roleList(){
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
			
			$this->load->model('administrator/rolemodel','rm');
			$collection = $this->rm->getRoleList($start, $limit, $sort, $filters);
			
	    	$res['data'] = ($collection) ? $collection->toArray() : array();
			$res['totalCount'] = $this->rm->roleCount($filters);
			$data['status'] = 'ok';
			$data['success'] = true;
			$data['result'] = $res;
			$data['timingStart'] = $this->timingStart;
		//}
    	$this->load->view($this->result, $data);
	}


}

?>