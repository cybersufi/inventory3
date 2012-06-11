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
	
	public function __call($name, $arguments) {
		switch ($name) {
      		case 'getTopUser': 
				if (count($arguments) == 0) {
					return $this->_getTopUser();
				} else {
          			trigger_error("Method <strong>$name</strong> with argument ". implode (',', $arguments)."doesn't exist", E_USER_ERROR);
        		}
			break;
			default:
        			trigger_error("Method <strong>$name</strong> doesn't exist", E_USER_ERROR);
			break;
    	}
	}
	
	private function _getTopUser() {
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
	
}

?>