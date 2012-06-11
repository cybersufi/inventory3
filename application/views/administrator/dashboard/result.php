<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

switch($type) {
  	case 'list' :
    		$data['total'] = $total;
    		$data['data'] = array();
    		if ($res != null) {
      		switch($funcname) {
        			case 'ulist' :
          			foreach ($res as $row) {
          				$cur_row = array();
            				$cur_row['id'] = $row->uid;
						$cur_row['username'] = $row->username;
						$cur_row['email'] = $row->email;
						$cur_row['usergroup'] = $row->groupname;
						$cur_row['status'] = ($row->activation_code == 1) ? true : false;
						$cur_row['lastlogin'] = date('d/m/Y H:i', $row->lastlogin);
						$cur_row['ipaddress'] = $row->ipaddress;
						if (!empty($row->reason)){
							$cur_row['status'] = 'Banned';
						}
            				array_push($data['data'], $cur_row);
					}
          		break;
				case 'nlist' :
          			foreach ($res as $row) {
          				$cur_row = array();
            				$cur_row['userid'] = $row->userid;
						$cur_row['username'] = $row->username;
						$cur_row['email'] = $row->email;
						$cur_row['status'] = ($row->activation_code == 1) ? 'Active' : 'Inactive';
            				array_push($data['data'], $cur_row);
					}
          		break;
				case 'tlist' :
          			foreach ($res as $row) {
          				$cur_row = array();
            			$cur_row['userid'] = $row->userid;
						$cur_row['username'] = $row->username;
						$cur_row['usergroup'] = $row->usergroup;
						$cur_row['total'] = $row->total;
						array_push($data['data'], $cur_row);
					}
          		break;
				case 'hlist' :
          			foreach ($res as $row) {
          				$cur_row = array();
            				$cur_row['datetime'] = date('d/m/Y H:i', $row->datetime);
						$cur_row['ipaddress'] = $row->ipaddress;
						array_push($data['data'], $cur_row);
					}
          		break;
				case 'llist' :
					$data['data'] = $res;
				break;
				default:
					$data['data'] = null;
				break;
      		}
    		}
    	break;
	case 'priv' :
		$data['success'] = $success;
		$data['privilege'] = $msg;
	break;
  	case 'form' :
    		$data['success'] = $success;
    		$data['msg'] = $msg;
    break;
}
  
echo json_encode($data);

?>