<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class user extends CI_Controller {

	public function index()
	{
		$this->load->view('administrator/main');
	}
	
	public function getList() {
		$data['type'] = 'list';
		$data['funcname'] = 'ulist';
    	$data['res'] = null;
    	$data['total'] = 0;
		
		//$issiteadmin = $this->session->userdata('issiteadmin');
		//if ($issiteadmin) {
			$start = $this->input->get_post('start');
	    	$limit = $this->input->get_post('limit');
	    	$filters = $this->input->get_post('filter');
			$sort = $this->input->get_post('sort');
	    	$isFiltered = false;
			$isSorted = false;
	    	$sl = "";
	    	
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
	    
		    if (empty($start) && empty($limit)) {
		      	//$sl = ($isFiltered) ? $this->um->getUserListFiltered($sort, $filters) : $this->um->getUserList($sort);
		      	$collection = ($isFiltered) ? $this->um->getUserList(0,0, $sort, $filters);
		    } else if (empty($start)) {
		      	//$sl = ($isFiltered) ? $this->um->getUserListFiltered($limit, $sort, $filters) : $this->um->getUserList($limit, $sort);
		    } else {
		      	//$sl = ($isFiltered) ? $this->um->getUserListFiltered($start, $limit, $sort, $filters) : $this->um->getUserList($start, $limit, $sort);
		    }
			
	    	$data['type'] = 'list';
			$data['funcname'] = 'ulist';
	    	$data['res'] = $sl->result();
	    	$data['total'] = ($isFiltered) ? $this->um->getUserCount($filters) : $this->um->getUserCount();
		//}
    	$this->load->view($this->result, $data);
	}
	
}

?>