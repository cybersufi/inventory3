<?php

class dashboardmodel extends CI_Model {
	
	private $user_tbl;
	private $group_tbl;
	private $banned_tbl;
	private $session_tbl;
	private $user_history;
	
	public function __construct() {
		parent::__construct();
		$this->user_tbl = 'users';
		$this->group_tbl = 'groups';
		$this->banned_tbl = 'banned';
		$this->session_tbl = 'sessions';
		$this->user_history = 'users_history';
	}
	
	public function getTopUser() {
		$uh = $this->user_history;
		$gl = $this->group_tbl;
		$ul = $this->user_tbl;

    	$sql = $this->db->select($uh.'.userid, '.
							     $ul.'.username, '.
							     $gl.'.title as usergroup, count(*) as total')
 		->from($uh)
		->join($ul, $ul.'.id = '.$uh.'.userid','left')
		->join($gl, $gl.'.id = '.$ul.'.group_id','left')
		->group_by($uh.".userid")
	 	->get();
    	return $var = ($sql->num_rows() > 0) ? $sql : false;
	}
	
	public function getLoggedUser() {
		$ul = $this->user_tbl;
		$gl = $this->group_tbl;
		$st = $this->session_tbl;

    	$sql = $this->db->select($st.'.ip_address as ipaddress, '.
							 $st.'.last_activity as lastactivity, '.
							 $st.'.user_data as userdata')
 		->from($st)
	 	->get();
    	return $var = ($sql->num_rows() > 0) ? $sql : false;
	}
	
	public function getUserById($id) {
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
}

?>