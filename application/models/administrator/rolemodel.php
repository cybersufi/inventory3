<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class Rolemodel extends CI_Model {

	private $role_data = "";
	private $user_roles = "";

	function __construct() {
		parent::__construct();
		$this->role_data = "role_data";
		$this->user_roles = "user_roles";
	}

	public function roleCount($filters=null) {
		$pt = $this->role_data;
    
    	$this->db->select($pt.'.id')
		->from($pt);
    
    	if ($filters != null) {
      		$this->db->where($filters, NULL, FALSE);
    	}	
	    
		return $this->db->count_all_results();
  	}

  	public function getRoleList($start=0, $limit=0, $sorter=NULL, $filters=NULL) {
    	$pt = $this->role_data;
    
    	$this->db->select($pt.'.id, '.
					  $pt.'.rolename')
    	->from($pt);
    
	    if ($filters != NULL) {
	      	$this->db->where($filters, NULL, FALSE);
	    }
    	
		if ($sorter != NULL) {
			$this->db->order_by($sorter['property'], $sorter['direction']);
		}
		
	    if ($limit > 0) {
	      	$this->db->limit($limit,$start);
	    }
    
    	$res = $this->db->get();
    		
		if ($res->num_rows() > 0) {
			$coll = new RoleCollection();
			foreach ($res->result() as $row) {
				$role = new Role();
				$role->setId($row->id);
				$role->setName($row->rolename);
				$coll->add($role);
			}
			return $coll;
		} else {
			return null;
		}
  	}

}

?>