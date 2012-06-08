/**
 * Represents a session against the PartKeepr Server.
 */
Ext.define("Administrator.Components.Session.SessionManager", {
	extend: 'Ext.util.Observable',
	 
	/**
	 * Holds the current session ID, or null if no session is active
	 * 
	 * @var string
	 */
	session: null,
	
	/**
	 * Holds an instance of the login dialog, or "null" if no login dialog is active.
	 * 
	 * @var object
	 */
	loginDialog: null,
	
	
	/**
	 * Constructs a new SessionManager.
	 * 
	 * @param config Optional: Specifies a configuration object
	 */
	constructor: function(config){
		this.addEvents({
			"login": true
		});
		
		this.callParent(arguments);
	},
	/**
	 * Creates and shows the login dialog, as well as setting up any event handlers.
	 */
	login: function (username, password) {
		this.loginDialog = Ext.create("Administrator.Components.Auth.LoginDialog");
		
		if (username && password) {
			this.onLogin(username, password);
		} else {
			this.loginDialog.on("login", this.onLogin, this);
			this.loginDialog.show();
		}
	},
	/**
	 * Removes the current session.
	 */
	logout: function () {
		this.session = null;
	},
	/**
	 * Callback from the login dialog when the "login" button was clicked.
	 * 
	 * @param username The username, as entered in the login dialog
	 * @param password The password, as entered
	 */
	onLogin: function (username, password) {
		//Ext.require('Administrator.Util.ServiceCall');
		//var k = new Administrator.Util.ServiceCall("Auth", "login");
		var k = Ext.create('Administrator.Util.ServiceCall', 'Auth', 'login');
		k.setParameter("username", username);
		//k.setParameter("password", md5(password));
		k.setParameter("password", this.encrypt(password));
		
		k.enableAnonymous();
		k.setHandler(Ext.bind(this.onAfterLogin, this));
		k.doCall();
	},
	/**
	 * Callback when the service call is complete.
	 * 
	 * @param response The session ID
	 */
	onAfterLogin: function (response) {
		this.setSession(response.sessionid);
		this.loginDialog.destroy();
		
		Administrator.getApplication().setAdmin(response.admin);
		Administrator.getApplication().setUsername(response.username);
		
		this.fireEvent("login");
		
	},
	/**
	 * Sets the session
	 */
	setSession: function (sessionid) {
		this.session = sessionid;
	},
	/**
	 * Returns the current session
	 * 
	 * @returns the session, or null if no session is available
	 */
	getSession: function () {
		return this.session;
	},
	/**
	 * Returns encrypted password
	 * 
	 * @returns ecrypted password
	 */
	encrypt: function (a) {
    	var str = a;
    	for(i=0; i<5;i++) {
			str=strrev(base64_encode(str));
		}
		str = str_replace('=','.',str);
    	return str;
    }
});