<?php

class Usermodel extends CI_Model {
	
	private $user_tbl;
	private $group_tbl;
	private $banned_tbl;
	private $session_tbl;
	private $user_history;
	
	const GET_DETAIL = 1;
	const BY_USERNAME = 2;
	
	public function __construct() {
		parent::__construct();
		$this->user_tbl = 'users';
		$this->group_tbl = 'groups';
		$this->banned_tbl = 'banned';
		$this->session_tbl = 'sessions';
		$this->user_history = 'users_history';
	}
	
	public function userCount($filters=null) {
		$ul = $this->user_tbl;
    	$gl = $this->group_tbl;
    
    	$this->db->select($ul.'.id')
		->from($ul)
		->join($gl, $gl.'.id = '.$ul.'.group_id','left');
    
    	if ($filters != null) {
      		$this->db->where($filters, NULL, FALSE);
    	}	
	    
		return $this->db->count_all_results();
  	}
  
  	public function getUserList($start=0, $limit=0, $sorter=NULL, $filters=NULL) {
    	$ul = $this->user_tbl;
		$gl = $this->group_tbl;
		$bl = $this->banned_tbl;
    
    	$this->db->select($ul.'.id as uid, '.
					  $ul.'.username, '.
					  $ul.'.activation_code, '.
					  $ul.'.email, '.
					  $ul.'.lastlogin, '.
					  $ul.'.ipaddress, '.
					  $gl.'.title as groupname, '.
					  $bl.'.reason')
    	->from($ul)
    	->join($gl, $gl.'.id = '.$ul.'.group_id','left')
		->join($bl, $bl.'.id = '.$ul.'.banned_id','left');
    
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
    
    	//return ($res->num_rows() > 0) ? $res : false;
		
		if ($res->num_rows() > 0) {
			$coll = new UserCollection();
			foreach ($res->result() as $row) {
				$user = new User();
				$user->setUserID($row->uid);
				$user->setUsername($row->username);
				$user->setGroupname($row->groupname);
				$user->setEmail($row->email);
				$user->setLastLogin($row->lastlogin);
				$user->setLastIp($row->ipaddress);
				$user->setStatus($row->activation_code);
				$user->setBannedReason($row->reason);
				$coll->add($user);
			}
			return $coll;
		} else {
			return false;
		}
  	}
	
	public function getUserCredential1($username) {
		$res = $this->db->select($this->user_tbl.'.password, '.
								 $this->user_tbl.'.hash')
		->from($this->user_tbl)
		->where($this->user_tbl.'.username', $username)
		->limit(1)
		->get();

		return $var = ($res->num_rows() > 0) ? $res->row() : false;
	}
	
	private function getUser1($id) {
    		$ul = $this->user_tbl;
    		$sql = $this->db->select($ul.'.id as uid')
	           	->from($ul)
	           	->where('id',$id)
	           	->limit(1,0)
				->get();
    		return $var = ($sql->num_rows() > 0) ? true : false;
  	}
  
  	private function getUser2($uname) {
    		$ul = $this->user_tbl;
    		$sql = $this->db->select($ul.'.id')
	           	->from($gl)
	           	->where('username', $uname)
	           	->limit(1,0)
	           	->get();
    		return $var = ($sql->num_rows() > 0) ? true : false;
  	}
  
  	private function getUser3($id) {
    		$ul = $this->user_tbl;
		$gl = $this->group_tbl;
		$bl = $this->banned_tbl;

    		$sql = $this->db->select($ul.'.id as uid, '.
							 $ul.'.username, '.
							 $ul.'.email, '.
							 $ul.'.activation_code, '.
							 $gl.'.title as groupname, '.
							 $bl.'.reason')
 		->from($ul)
	 	->join($gl, $gl.'.id = '.$ul.'.group_id','left')
	 	->join($bl, $bl.'.id = '.$ul.'.banned_id','left')
      	->where($ul.'.id',$id)
      	->limit(1,0)
      	->get();
    		return $var = ($sql->num_rows() > 0) ? $sql : false;
  	}
	
	private function getLoginHistory1($userid) {
		$uh = $this->user_history;

    		$sql = $this->db->select($uh.'.datetime, '.
							 $uh.'.ipaddress ')
 		->from($uh)
		->where($uh.".userid", $userid)
		->order_by($uh.".datetime", "DESC")
	 	->get();
    		return $var = ($sql->num_rows() > 0) ? $sql : false;
	}
	
	private function changeUserGroup1($user_id, $group_id) {
		$this->db->where($this->user_tbl.'.id',$user_id)->update($this->user_tbl, array ($this->user_tbl.'.group_id' => $group_id));
		return $var = ($this->db->affected_rows() > 0) ? true : false;
	}
	
	private function runQuery($sql_query){
		$query = $this->db->query($sql_query);
		return $query;
	}
	
}

?>