Ext.define('Administrator.Components.Statusbar', {
	extend: 'Ext.ux.statusbar.StatusBar',
	
	require: 'Administrator.Widgets.*',
	
	defaultText: "Ready.",
	defaultIconCls: 'x-status-valid',
	iconCls: 'x-status-valid',
	autoClear: 3000,
	initComponent: function () {
		this.connectionButton = Ext.create("Administrator.Widgets.ConnectionButton");
		this.connectionButton.on("click", this.onConnectionButtonClick, this);
		this.timeDisplay = Ext.create("Administrator.Components.TimeDisplay");
		this.currentUserDisplay = Ext.create("Ext.toolbar.TextItem");
		
		this.currentUserDisplay.setText("Not logged in");
		
		/*this.showMessageLog = Ext.create("Ext.Button",{
			icon: 'resources/silkicons/application_osx_terminal.png',
			cls: 'x-btn-icon',
			handler: function () {
				Administrator.getApplication().toggleMessageLog();
			}
		});*/
		
		this.systemNoticeButton = Ext.create("Administrator.Widgets.SystemNoticeButton", {
			hidden: true
		});
		
		Ext.apply(this, {
			items: [
			        this.currentUserDisplay,
			        {xtype: 'tbseparator'},
			        this.timeDisplay,
			        { xtype: 'tbseparator' },
			        //this.showMessageLog,
			        //{ xtype: 'tbseparator' },
			        this.connectionButton,
			        this.systemNoticeButton
			        
			        ]
		});
		
		
		this.callParent();
	},
	getConnectionButton: function () {
		return this.connectionButton;
	},
	setCurrentUser: function (username) {
		this.currentUserDisplay.setText("Logged in as"+": "+username);
	},
	startLoad: function (message) {
		if (message !== null) {
			this.showBusy({text: message, iconCls: "x-status-busy"});
		} else {
			this.showBusy();
		}
	}, 
	endLoad: function () {
		this.clearStatus({useDefaults: true});
	},
	onConnectionButtonClick: function () {
		if (Administrator.getApplication().getSession()) {
			Administrator.getApplication().logout();
		} else {
			var o = new Administrator.Component.Auth.LoginDialog();
	    	o.show();
		}
	}
});


