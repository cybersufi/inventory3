<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class Auth extends CI_Controller {
	
	private $sitename = "";
	
	public function __construct() {
		parent::__construct();
		$this->CI =& get_Instance();
		$this->sitename = $this->CI->config->item('site_name');
		$this->load->library('auth');
	}
	
	public function index()
	{
		$this->load->view('welcome_message');
	}
	
	public function doLogin() {
		$sess_id = $this->session->userdata('id');
		$data['base_url'] = base_url();
		if (empty($sess_id)) {
			$config = array(
				array(
					'field'   => 'username', 
					'label'   => 'Username', 
					'rules'   => 'required'
				), array(
					'field'   => 'password', 
					'label'   => 'Password', 
					'rules'   => 'required'
				)
			);
			
			$this->form_validation->set_rules($config);
			
			if ($this->form_validation->run()) {
				$res = $this->redux_auth->login (
					$this->input->post('username'),
					$this->input->post('password')
				);
				
				switch($res){
					case 'NOT_ACTIVATED': 
						$data['success'] = 'false';
						$data['msg'] = 'Access Denied. Your account is not activated. Please contact the administrator';
						break;
					
					case 'BANNED': 
						$data['success'] = 'false';
						$data['msg'] = 'Access Denied. '.$this->session->flashdata('login');
						break;
					
					case 'false': 
						$data['success'] = 'false';
						$data['msg'] = 'Access Denied. Wrong Username or Password';
						break;
					
					case 'true': 
						$data['success'] = 'true';
						$data['msg'] = 'Access Granted. Welcome "'.strtoupper($this->input->post('username')).'".';
						break;
					
					default: 
						$data['success'] = 'false';
						$data['msg'] = 'Access Denied.';
				}
				$this->session->set_flashdata($data);
				redirect(base_url('administrator/login'), 'location	');
			} else {
				$data['success'] = 'false';
				$data['msg'] = 'Invalid data, Please try again';
				$this->session->set_flashdata($data);
				redirect(base_url('administrator/login'), 'refresh');
			}
		} else {
			redirect(base_url('administrator/main'), 'refresh');
		}
	}
	
	public function doLogout() {
		
	}
}

?>