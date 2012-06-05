/**
 * Defines the login dialog
 */
Ext.define('Administrator.Components.Auth.LoginDialog', {
	extend: 'Ext.Window',
	/* Various style settings */
	title: "Administrator: Login",
	
	width: 400,
	height: 125,
	
	modal: true,
	resizable: false,
	
	layout: 'anchor',
	
	bodyStyle: 'padding: 5px;',
	
	/**
	 * Initializes the login dialog component 
	 */
	initComponent: function () {
		
		this.loginField = Ext.ComponentMgr.create({
	    	xtype: 'textfield',
	    	value: "",
	    	fieldLabel: "Username",
	    	anchor: '100%'
	    });

		this.passwordField = Ext.ComponentMgr.create({
        	xtype: 'textfield',
        	inputType: "password",
        	value: "",
        	fieldLabel: "Password",
        	anchor: '100%'
        });
		
		Ext.apply(this, {
			// Login when "enter" was hit
			keys: [{
				key: Ext.EventObject.ENTER,
				handler: this.login,
				scope: this
			}],
			items: [
			        	this.loginField,
			        	this.passwordField
			],
			dockedItems: [{
			       xtype: 'toolbar',
			       enableOverflow: true,
			       dock: 'bottom',
			       ui: 'footer',
			       pack: 'start',
			       defaults: {minWidth: 100},
			       items: [
			       	{
			       		text: "Connect",
			       		icon: 'frontend/administrator/resources/silkicons/connect.png',
			       		handler: Ext.bind(this.login, this)
			       	},{
			       		text: "Close",
			       		handler: Ext.bind(this.close, this),
			       		icon: 'frontend/administrator/resources/silkicons/cancel.png'
			       	}]
			}]
		});
		
		this.callParent(arguments);

		// Focus the login field on show
		this.on("show", function () { this.loginField.focus(); }, this);
	},
	/**
	 * Fires the "login" event
	 */
	login: function () {
		this.fireEvent("login", this.loginField.getValue(), this.passwordField.getValue());
	}

});