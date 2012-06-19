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
	
	public function userList() {
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
			
	    	$res['data'] = ($collection) ? $collection->toArray() : array();
			$res['totalCount'] = $this->um->userCount($filters);
			$data['status'] = 'ok';
			$data['success'] = true;
			$data['result'] = $res;
		//}
    	$this->load->view($this->result, $data);
	}
	
	public function addUser() {
		$res = $this->redux_auth->check_username($this->input->post('username'));
		if ($res == false) {
			$gid = $this->session->userdata('gid');
			if ($gid == 0) {
				
				$config = array(
					array(
						'field'   => 'username', 
						'label'   => 'Username', 
						'rules'   => 'required'
					), array(
						'field'   => 'password', 
						'label'   => 'Password', 
						'rules'   => 'required'
					),  array(
						'field'   => 'password2', 
						'label'   => 'Repeat Password', 
						'rules'   => 'required'
					), array(
						'field'   => 'question', 
						'label'   => 'Secret Question', 
						'rules'   => 'required'
					), array(
						'field'   => 'answer', 
						'label'   => 'Secret Answer', 
						'rules'   => 'required'
					),
				);
						
				$this->form_validation->set_rules($config);
				
				if ($this->form_validation->run()) {
					$redux = $this->redux_auth->register (
						$this->input->post('username'),
						$this->input->post('password'),
						$this->input->post('email'),
						$this->input->post('question'),
						$this->input->post('answer')
					);
					
					switch($redux) {
						case 'REGISTRATION_SUCCESS' :
						case 'REGISTRATION_SUCCESS_EMAIL' :
							$data['success'] = 'true';
							$data['msg'] = 'User registered';
						break;
						case 'false' :
							$data['success'] = 'false';
							$data['msg'] = 'User Registration failed. Please try again';
						break;
						default :
							$data['success'] = 'false';
							$data['msg'] = 'Unknown Error. Please try again';
						break;
					}
				} else {
					$data['success'] = 'false';
					$data['msg'] = 'Invalid Data. Please try again';
				}
			} else {
				$data['success'] = 'false';
				$data['msg'] = 'You have no privilege to add user.';
			}
		} else {
			$data['success'] = 'false';
			$data['msg'] = 'Username already used.';
		}
		$data['type'] = 'form';
		$this->load->view($this->result, $data);
		return null;
	}

	private function sortParser($sorter) {
		$sorter = json_decode($sorter);
		$sort = NULL;
		for ($i=0; $i < count($sorter); $i++) { 
			$sortitem = $sorter[$i];
			switch ($sortitem->property) {
				case 'id':
					$sort['property'] = 'uid';
				break;
				case 'usergroup':
					$sort['property'] = 'groupname';
				break;
				case 'status' :
					$sort['property'] = 'activation_code';
				break;
				default :
					$sort['property'] = $sortitem->property;
			}
			$sort['direction'] = $sortitem->direction;
		}
		return $sort;
	}
	
	private function filterParser($filters) {
    		$filters = json_decode($filters);
    		$where = ' "0" = "0" ';
    		$qs = '';
		
		if (is_array($filters)) {
   			for ($i=0;$i<count($filters);$i++){
            		$filter = $filters[$i]; 
            		$field = '';
  
  				switch ($filter->field) {
    					case 'usergroup' : {
 						$field = 'title';
				      	break;
				    	}
					case 'status' : {
						$field = 'activation_code';
				      	break;
				    	}
    					default : {
      					$field = $filter->field;
    					}
				}
  
  				if ($filter->type == 'boolean') {
					$value = (strstr($filter->value, "yes")) ? 1 : 0;
            		} else {
            			$value = $filter->value;
				}
						
           		$compare = isset($filter->comparison) ? $filter->comparison : null;
            		$filterType = $filter->type;
    
            		switch($filterType){
                		case 'string' : $qs .= " AND ".$field." LIKE '%".$value."%'"; break;
 					case 'list' :
						if (strstr($value,',')){
	    						$fi = explode(',',$value);
						    	for ($q=0;$q<count($fi);$q++) {
						        	$fi[$q] = "'".$fi[$q]."'";
					    		}
    							$value = implode(',',$fi);
   							$qs .= " AND ".$field." IN (".$value.")";
						} else {
    							$qs .= " AND ".$field." = '".$value."'";
					     }
				 	break;
				 	case 'boolean' : $qs .= " AND ".$field." = ".($value); break;
				 	case 'numeric' :
						switch ($compare) {
						    	case 'eq' : $qs .= " AND ".$field." = ".$value; break;
						   	case 'lt' : $qs .= " AND ".$field." < ".$value; break;
						    	case 'gt' : $qs .= " AND ".$field." > ".$value; break;
				     	}
				 	break;
					case 'date' :
						switch ($compare) {
							case 'eq' : $qs .= " AND ".$field." = '".date('Y-m-d',strtotime($value))."'"; break;
							case 'lt' : $qs .= " AND ".$field." < '".date('Y-m-d',strtotime($value))."'"; break;
							case 'gt' : $qs .= " AND ".$field." > '".date('Y-m-d',strtotime($value))."'"; break;
						}
					break;
				}
   			}
   			$where .= $qs;
		}
    
		return $where;
	}
}

?>