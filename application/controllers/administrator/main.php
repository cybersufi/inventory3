<?php if ( ! defined('APPPATH')) exit('No direct script access allowed');

class Main extends CI_Controller {

	public function index()
	{
		$this->load->view('administrator/main');
		/*$this->load->library('Admin');
		$user = new User();
		$user->setUsername('baka');
		$arr = $user->toArray();
		//print_r($arr);
		//echo json_encode($arr);
		
		$user1 = new User();
		$user1->setUsername('bon');
		
		$user2 = new User();
		$user2->setUsername('bin');
		
		$col = new UserCollection();
		$col->add($user);
		$col->add($user1);
		$col->add($user2);
		//print_r($col->toArray());
		echo json_encode($col->toArray());*/
		
	}
}

?>