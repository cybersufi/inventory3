<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class dashboard extends CI_Controller {
	
	private $sitename = "";
	
	private $index;
	private $result;
	
	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		$this->sitename = $this->CI->config->item('site_name');
		$this->load->library('admin');
		$this->index = 'administrator/dashboard/index';
		$this->result = 'administrator/dashboard/result';
	}
	
	public function index() {
		$this->load->view('welcome_message');
	}
	
	public function topUser() {
		$data['type'] = 'list';
		$data['funcname'] = 'tlist';
		$data['res'] = null;
		$data['total'] = 0;
		
		//echo $this->input->ip_address();
		
		//$issiteadmin = $this->session->userdata('issiteadmin');
		//if ($issiteadmin) {
			$this->load->model('administrator/dashboardmodel','dm');
			$sl = $this->dm->getTopUser();
	    	$data['type'] = 'list';
			$data['funcname'] = 'tlist';
	    	$data['res'] = $sl->result();
	    	$data['total'] = $sl->num_rows();
		//}
    	$this->load->view($this->result, $data);
		//return null;
	}
	
	public function loggedUser() {
		$data['type'] = 'list';
		$data['funcname'] = 'llist';
		$data['res'] = null;
		$data['total'] = 0;
		
		//$issiteadmin = $this->session->userdata('issiteadmin');
		//if ($issiteadmin) {
			$this->load->model('administrator/dashboardmodel','dm');
			$sl = $this->dm->getLoggedUser();
			$res = array();
			if ($sl) {
				foreach ($sl->result() as $row) {
					$userdata = $row->userdata;
					$curr_res = array();
					if (!empty($userdata)) {
						$curr_res['ipaddress'] = $row->ipaddress;
						$curr_res['lastactivity']  = date('d/m/Y H:i', $row->lastactivity);
						$userdata = substr($userdata, 5, -1);
						$userdata = explode(";", $userdata);
						$userid = null;
						for ($i = 0; $i < count($userdata); $i++) {
							if (strstr($userdata[$i], "id")) {
								$j = $i+1;
								$tmp = explode(":", $userdata[$j]);
								$userid = str_replace("\"", '', $tmp[2]);
								$curr_res['userid'] = $userid;
								break;
							}
						}
						
						$user = $this->dm->getUserById($userid)->result();
						$curr_res['username'] = $user[0]->username;
						$curr_res['usergroup'] = $user[0]->groupname;
						$res[] = $curr_res;
					} else {
						continue;
					}
				}
			}
			$data['type'] = 'list';
			$data['funcname'] = 'llist';
    		$data['res'] = $res;
    		$data['total'] = count($res);
		//}
    	$this->load->view($this->result, $data);
		return null;
	}
	
	public function topIP() {
		return null;
	}
}

?>