function i18n (string) {
	return string;
}
Ext.define("PartKeepr.JsonWithAssociations", {
	extend: 'Ext.data.writer.Json',
	alias: 'writer.jsonwithassociations',

	/**
	 * @cfg {Array} associations Which associations to include.
	 */
	associations: [],

	getRecordData: function(record) {
		var me = this, i, key, subStore,
		data = me.callParent(arguments);

		var storeName;
		
		Ext.apply(data, record.getAssociatedData());
		
		return data;
	}
});
Ext.namespace('PartKeepr'); 
		
Ext.Loader.setPath({
    'PartKeepr': 'js'
});

PartKeepr.application = null;

Ext.application({
    name: 'PartKeepr',
    launch: function() {
    	Ext.get("loading").hide();
    	Ext.setLocale('en_US');
    	
    	this.createLayout();
    	
    	PartKeepr.application = this;
    	
    	// Set static data of the server
    	PartKeepr.setMaxUploadSize(window.parameters.maxUploadSize);
    	PartKeepr.setAvailableImageFormats(window.parameters.availableImageFormats);

    	this.sessionManager = new PartKeepr.SessionManager();
    	
    	/* Automatic session starting is active. This disables login/logout functionality. */
    	if (window.parameters.auto_start_session) {
    		this.getSessionManager().setSession(window.parameters.auto_start_session);
    		this.getStatusbar().connectionButton.hide();
    		this.onLogin();
    	} else {
        	// If auto login is wanted (for e.g. demo systems), put it in here
        	this.sessionManager.on("login", this.onLogin, this);
        	
        	if (window.parameters.autoLoginUsername) {
        		this.sessionManager.login(window.parameters.autoLoginUsername, window.parameters.autoLoginPassword);
        	} else {
        		this.sessionManager.login();
        	}
    	}
    	
    	
    	
        Ext.fly(document.body).on('contextmenu', this.onContextMenu, this);
    },
    onContextMenu: function (e, target) {
    	e.preventDefault();
    },
    /**
     * Handles the login function. Initializes the part manager window,
     * enables the menu bar and creates the stores+loads them.
     */
    onLogin: function () {
    	this.createGlobalStores();
		this.reloadStores();
		
		var j = Ext.create("PartKeepr.PartManager", {
			title: i18n("Part Manager"),
			iconCls: 'icon-brick',
			closable: false
		});
		
		this.addItem(j);
		this.menuBar.enable();
		
		this.doSystemStatusCheck();
		this.doUnacknowledgedNoticesCheck();
		
		/* Give the user preference stuff enough time to load */
		/* @todo Load user preferences directly on login and not via delayed task */
		this.displayTipWindowTask = new Ext.util.DelayedTask(this.displayTipOfTheDayWindow, this);
		this.displayTipWindowTask.delay(100);
		
		this.setSession(this.getSessionManager().getSession());
		
		this.getStatusbar().getConnectionButton().setConnected();
		
    },
    /**
     * Displays the tip of the day window.
     * 
     * This method checks if the user has disabled tips, and if so, this method
     * avoids showing the window. 
     */
    displayTipOfTheDayWindow: function () {
    	if (!this.userPreferenceStore._loaded) {
    		this.displayTipWindowTask.delay(100);
    		return;
    		
    	}
    	
    	if (!this.tipOfTheDayStore._loaded) {
    		this.displayTipWindowTask.delay(100);
    		return;
    	}
    	
    	if (PartKeepr.getApplication().getUserPreference("partkeepr.tipoftheday.showtips") !== false) {
    		var j = Ext.create("PartKeepr.TipOfTheDayWindow");
    		
    		if (j.getLastUnreadTip() !== null) {
    			j.show();
    		}
    	}
    },
    /**
     * Does a schema status call against the PartKeepr installation, in order to verify if the schema is up-to-date.
     * 
     * @param none
     * @return nothing
     */
    doSystemStatusCheck: function () {
    	var call = new PartKeepr.ServiceCall("System", "getSystemStatus");
		call.setHandler(Ext.bind(this.onSystemStatusCheck, this));
		call.doCall();
    },
    /**
     * Handler for the schema check 
     * @param data The data returned from the server
     */
    onSystemStatusCheck: function (data) {
    	if (data.data.schemaStatus !== "complete") {
    		alert(i18n("Your database schema is not up-to-date! Please re-run setup immediately!"));
    	}
    	
    	if (data.data.inactiveCronjobCount > 0) {
    		alert(i18n("The following cronjobs aren't running:")+"\n\n"+data.data.inactiveCronjobs.join("\n"));
    	}
    },
    /**
     * Returns the session manager
     * 
     * @returns SessionManager
     */
    getSessionManager: function () {
    	return this.sessionManager;
    },
    /*
     * Checks for unacknowledged system notices
     * 
     * @param none
     * @return nothing
     */
   	doUnacknowledgedNoticesCheck: function () {
   		var call = new PartKeepr.ServiceCall("SystemNotice", "hasUnacknowledgedNotices");
		
   		call.setHandler(Ext.bind(this.onUnacknowledgedNoticesCheck, this));
		call.doCall();
   	},
   	/**
     * Handler for the unacknowledged system notices check 
     * @param data The data returned from the server
     */
   	onUnacknowledgedNoticesCheck: function (data) {
   		if (data.data.unacknowledgedNotices === true) {
   			this.statusBar.systemNoticeButton.show();
   		} else {
   			this.statusBar.systemNoticeButton.hide();
   		}
   		
   		Ext.defer(this.doUnacknowledgedNoticesCheck, 10000, this);
   	},
    logout: function () {
    	this.menuBar.disable();
    	this.centerPanel.removeAll(true);
    	this.getSessionManager.logout();
    },
    createGlobalStores: function () {
    	this.footprintStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.Footprint',
    				pageSize: -1,
    				autoLoad: false
    			});
    	
    	this.siPrefixStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.SiPrefix',
    				pageSize: -1,
    				autoLoad: true
    			});
    	
    	this.distributorStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.Distributor',
    				pageSize: -1,
    				autoLoad: false
    			});
    	
    	this.manufacturerStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.Manufacturer',
    				pageSize: -1,
    				autoLoad: false
    			});
    	
    	this.partUnitStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.PartUnit',
    				pageSize: -1,
    				autoLoad: false
    			});
    	
    	this.unitStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.Unit',
    				pageSize: -1,
    				autoLoad: false
    			});
    	
    	this.userStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.User',
    				pageSize: -1,
    				autoLoad: false
    			});
    	
    	this.tipOfTheDayStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.TipOfTheDay',
    				pageSize: -1,
    				autoLoad: true,
    				listeners: {
    					scope: this,
    					load: this.storeLoaded
    				}
    			});
    	
    	this.userPreferenceStore = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.UserPreference',
    				pageSize: -1,
    				autoLoad: true,
    				listeners: {
    					scope: this,
    					load: this.storeLoaded
    				}
    			});
    },
    storeLoaded: function (store) {
    	store._loaded = true;
    },
    setAdmin: function (admin) {
    	this.admin = admin;
    },
    isAdmin: function () {
    	return this.admin;
    },
    getTipOfTheDayStore: function () {
    	return this.tipOfTheDayStore;
    },
    /**
     * Queries for a specific user preference. Returns either the value or null if the
     * preference was not found.
     * @param key The key to query
     * @returns the key value, or null if nothing was found
     */
    getUserPreference: function (key) {
    	var record = this.userPreferenceStore.findRecord("key", key);
    	
    	if (record) {
    		return record.get("value");
    	} else {
    		return null;
    	}
    },
    /**
     * Sets a specific user preference. Directly commits the change to the server.
     * 
     * @param key The key to set
     * @param value The value to set
     */
    setUserPreference: function (key, value) {
    	var record = this.userPreferenceStore.findRecord("key", key);
    	
    	if (record) {
    		record.set("value", value);
    	} else {
    		var j = new PartKeepr.UserPreference();
    		j.set("key", key);
    		j.set("value", value);
    		
    		this.userPreferenceStore.add(j);
    	}
    	
    	this.userPreferenceStore.sync();
    },
    getUserPreferenceStore: function () {
    	return this.userPreferenceStore;
    },
    getUnitStore: function () {
    	return this.unitStore;
    },
    getPartUnitStore: function () {
    	return this.partUnitStore;
    },
    getFootprintStore: function () {
    	return this.footprintStore;
    },
    getManufacturerStore: function () {
    	return this.manufacturerStore;
    },
    getDistributorStore: function () {
    	return this.distributorStore;
    },
    getDefaultPartUnit: function () {
    	return this.partUnitStore.findRecord("default", true);
    },
    getUserStore: function () {
    	return this.userStore;
    },
    getSiPrefixStore: function () {
    	return this.siPrefixStore;
    },
    /**
     * Converts the Character "micro" (µ, available on german keyboards via AltGr+m) to the Character "Mu" (μ).
     * 
     *  The standard for Si-Prefixes defines that the "Mu"-character should be used instead of the "micro" character.
     *  
     *  Wikipedia Entry for the "Micro" Si Prefix: http://en.wikipedia.org/wiki/Micro-
     *  
     */
    convertMicroToMu: function (value) {
    	/**
    	 * Since the Si-Prefix for "micro" is μ, but keyboard have "µ" on it
    	 * (note: both chars might look identical, depending on your font), we need
    	 * to convert "µ" (on the keyboard, Unicode U+00B5) to the Mu (U+03BC).
    	 */
    	
    	return str_replace("µ", "μ", value);
    },
    /**
     * Reload all global stores each 100 seconds.
     * 
     * @todo In the future, it would be nice to trigger a specific
     *       store reload when something happens. Example:
     *       
     *       If the user pulls down the storage location combo box,
     *       reload it.
     *       
     *       YES, this is becoming nasty. We have now 6 stores, each
     *       reloading every minute. This NEEDS to be fixed soon!
     *       
     */
    reloadStores: function () {
    	if (this.getSessionManager().getSession()) {
        	this.footprintStore.load();
        	this.manufacturerStore.load();
        	this.distributorStore.load();
        	this.partUnitStore.load();
        	this.unitStore.load();
        	this.userStore.load();
        	Ext.defer(PartKeepr.getApplication().reloadStores, 100000, this);	
    	}
    },
    /**
     * Creates the main view of PartKeepr.
     */
    createLayout: function () {

    	this.statusBar = Ext.create("PartKeepr.Statusbar");
    	
    	this.messageLog = this.createMessageLog();
    	
    	this.centerPanel = Ext.create("Ext.tab.Panel", {
    			xtype: 'tabpanel',
    			border: false,
    			region: 'center',
    			bodyStyle: 'background:#DBDBDB',
    			plugins: Ext.create('Ext.ux.TabCloseMenu')
    			
    	});
    	
    	this.menuBar = Ext.create("PartKeepr.MenuBar");
    	
    	this.menuBar.disable();
    	
    	Ext.create('Ext.container.Viewport', {
    		layout: 'fit',
    		items: [{
    			xtype: 'panel',
    			border: false,
    			layout: 'border',
    			items: [
    			       this.centerPanel,
    			       this.messageLog
    			       ],
                bbar: this.statusBar,
                tbar: this.menuBar
    		}]
    		
        });    	
    },
    addItem: function (item) {
    	this.centerPanel.add(item);
    },
    createMessageLog: function () {
    	return Ext.create("PartKeepr.MessageLog", {
            height: 200,
            hidden: true,
            split: true,
            title: i18n("Message Log"),
            titleCollapse: true,
            collapsible: true,
            region: 'south',
            listeners: {
        		beforecollapse: Ext.bind(
        			function (obj) {
        				this.hideMessageLog();
        				return false;
        			},
        			this)
        	}
    	});
    },
    log: function (message) {
    	this.logMessage(message, "none");
    },
    logMessage: function (message, severity) {
    	if (message != i18n("Ready.")) {
    	 var r = Ext.ModelManager.create({
             message: message,
             severity: severity,
             date: new Date()
         }, 'PartKeepr.Message');
    	 
    	 this.messageLog.getStore().add(r);
    	}
    },
    hideMessageLog: function () {
    	this.messageLog.hide();
    },
    showMessageLog: function () {
    	this.messageLog.show();
    },
    toggleMessageLog: function () {
    	if (this.messageLog.isHidden()) {
    		this.showMessageLog();
    	} else {
    		this.hideMessageLog();
    	}
    	
    },
    getStatusbar: function () {
    	return this.statusBar;
    },
    getSession: function () {
    	return this.getSessionManager().getSession();
    },
    setSession: function (session) {
    	if (session) {
    		this.getStatusbar().getConnectionButton().setConnected();	
    	} else {
    		this.getStatusbar().getConnectionButton().setDisconnected();
    		this.setUsername("");
    	}
    	
    },
    /**
     * Sets the username. This should only be called from the login dialog.
     * 
     * Also updates the statusbar to reflect the username.
     * 
     * @param {string} username The username to set
     */
    setUsername: function (username) {
    	this.username = username;
    	this.getStatusbar().setCurrentUser(username);
    },
    /**
     * Returns the current username 
     * @returns {string}
     */
    getUsername: function () {
    	return this.username;
    }
});

/**
 * <p>This static method returns a REST object definition for use with any models.</p>
 * <p>It automatically sets the session (if available) and the prefix for the given REST service.</p>
 * @param {string} service The REST service to call. Only use the base name, e.g. "Footprint" instead of "FootprintService".
 * @return {Object} The RESTProxy definition
*/
PartKeepr.getRESTProxy = function (service) {
	var request;
	
	var obj = {
		batchActions: false,
		url: PartKeepr.getBasePath()+ '/'+service,
		listeners: {
        	exception: function (proxy, response, operation) {
        		try {
                    var data = Ext.decode(response.responseText);
                    
                    request = {
                			response: response.responseText
                	};
                    
                	PartKeepr.ExceptionWindow.showException(data.exception, request);
                } catch (ex) {
                	var exception = {
                			message: i18n("Critical Error"),
                			detail: i18n("The server returned a response which we were not able to interpret.")
                	};
                	
             	
                	request = {
                			response: response.responseText
                	};
                	
                	PartKeepr.ExceptionWindow.showException(exception, request);
                }
        	}
        },
		reader: {
            type: 'json',
            root: 'response.data',
            successProperty: "success",
            messageProperty: 'message',
            totalProperty  : 'response.totalCount'
        },
        writer: {
            type: 'jsonwithassociations'
        }
        
	};
	//Ext.data.AjaxProxy.superclass.constructor.apply(this, arguments);
	return new Ext.data.proxy.Rest(obj);
};

PartKeepr.getSession = function () {
	alert("This should not be called.");
	return "hli2ong0ktnise68p9f5nu6nk1";
};

PartKeepr.log = function (message) {
	PartKeepr.getApplication().log(message);
};

/**
 * <p>This static method returns the instance of the application.</p>
 * @return {Object} The application
*/
PartKeepr.getApplication = function () {
	return PartKeepr.application;
};

PartKeepr.getBasePath = function () {
	return "rest.php";
};

PartKeepr.getImagePath = function () {
	return "image.php";
};

PartKeepr.setMaxUploadSize = function (size) {
	PartKeepr.maxUploadSize = size;
};

PartKeepr.getMaxUploadSize = function () {
	return PartKeepr.maxUploadSize;
};

PartKeepr.bytesToSize = function (bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)),10);
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

PartKeepr.setAvailableImageFormats = function (formats) {
	PartKeepr.imageFormats = formats;
};

PartKeepr.getAvailableImageFormats = function () {
	return PartKeepr.imageFormats;
};

PartKeepr.serializeRecords = function (records) {
	var finalData = [];
	
	for (var i=0;i<records.length;i++) {
		finalData.push(records[i].data);
	}
	
	return finalData;
}; 
//Ext.Compat.showErrors = true;


/*
 * This file is part of the JerryMouse Framework.
 *
 * JerryMouse is free software; you can redistribute and/or modify it under the
 * terms of the GNU General Public License version 2 as published by the
 * Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 */

Ext.locales = {
		de_DE: {
			"flag": "de",
			"name": "Deutsch (Deutschland)",
			"dateformat": "d.m.Y H:i:s T"
		},
		en_US: {
			"flag": "us",
			"name": "English (USA)",
			"dateformat": "n/j/Y H:i:s T"
		}
};

Ext.setLocale = function (locale) {
	Ext.jm_locale = locale;
};

Ext.getLocale = function () {
	return Ext.jm_locale;
};

Ext.getLocaleFlag = function () {
	return Ext.locales[Ext.jm_locale].flag;
};

Ext.getDateFormat = function () {
	return Ext.locales[Ext.jm_locale].dateformat;
};

Ext.define('PartKeepr.RememberChoiceMessageBox', {
    extend: 'Ext.window.MessageBox',
   
    escButtonAction: null,
    
    initComponent: function () {
    	this.callParent();
    	
    	this.rememberChoiceCheckbox = Ext.create("Ext.form.field.Checkbox", {
    		margin: {
    			top: "10px"
    		},
    		boxLabel: i18n("Don't ask again")
    	});
    	
    	this.topContainer.add(this.rememberChoiceCheckbox);
    },
    onEsc: function() {
    	
    	if (this.escButtonAction !== null) {
    		var btnIdx;
    		
    		switch (this.escButtonAction) {
    			case "ok": btnIdx = 0; break;
    			case "yes": btnIdx = 1; break;
    			case "no": btnIdx = 2; break;
    			case "cancel": btnIdx = 3; break; 
    			default: btnIdx = 3; break;
    		}

    		this.btnCallback(this.msgButtons[btnIdx]);
    	} else {
    		this.callParent();
    	}
    }
});
Ext.define('PartKeepr.FileUploadDialog', {
    extend: 'Ext.window.Window',
    
    title: i18n("File Upload"),
    fileFieldLabel: i18n("File"),
    uploadButtonText: i18n('Select File...'),
    uploadURL: PartKeepr.getBasePath()+"/TempFile",
    layout: 'fit',
    resizable: false,
    modal: true,
    iconCls: 'icon-drive-upload',
    initComponent: function () {
    	
    	if (this.imageUpload) {
    		this.uploadURL = PartKeepr.getBasePath()+"/TempImage";
    	}
    	
    	this.addEvents("fileUploaded");
    	
    	this.uploadButton = Ext.create("Ext.button.Button",
    			{
    	        	text: i18n('Upload'),
    	        	iconCls: 'icon-drive-upload',
    	        	width: 120,
    	        	handler: Ext.bind(function() {
    	        		var form = this.form.getForm();
    	        		
    	        		var values = form.getValues();
    	        		
    	        		if (this.fileField.getValue() === "" && this.urlField.getValue() === "") {
    	        			Ext.Msg.alert(i18n("Error"), i18n("Please select a file to upload or enter an URL"));
    	        			return;
    	        		}
    	        		
    	        		
    	        		if(form.isValid()){
    	        			form.submit({
    	        				url: this.uploadURL,
    	        				params: {
    	        				call: "upload",
    	                    	session: PartKeepr.getApplication().getSession()
    	                    },
    	                    success: Ext.bind(function(fp, o) {
    	                    	this.fireEvent("fileUploaded", o.result.response);
    	                    	this.close();
    	                    },this),
    	                    failure: function(form, action) {
    	                    	
    	                    	 var data = Ext.decode(action.response.responseText);
    	                         
    	                         request = {
    	                     			response: action.response.responseText
    	                     	};
    	                         
    	                     	PartKeepr.ExceptionWindow.showException(data.exception, request);
    	                    }
    	                });
    	            }
    	        }, this)
    	    });
    	
    	this.urlField = Ext.create("Ext.form.field.Text", {
    		fieldLabel: i18n("URL"),
    		labelWidth: 50,
    		name: "url",
    		anchor: '100%'
    	});
    	
    	this.tbButtons = [ this.uploadButton ];
    	
    	if (this.imageUpload) {
    		
    		this.title = i18n("Image Upload");
    		this.fileFieldLabel = i18n("Image");
    		this.uploadButtonText = i18n("Select Image...");
    		
    		this.fileFormatButton = Ext.create("Ext.button.Button", {
    			text: i18n("Available Formats"),
    			width: 120,
    			iconCls: 'icon-infocard',
    			handler: this.showAvailableFormats,
    			scope: this
    		});
    		
    		this.tbButtons.push(this.fileFormatButton);
    	}
    	
    	this.fileField = Ext.create("Ext.form.field.File",{
    	        xtype: 'filefield',
    	        name: 'userfile',
    	        fieldLabel: this.fileFieldLabel,
    	        labelWidth: 50,
    	        msgTarget: 'side',
    	        anchor: '100%',
    	        buttonText: this.uploadButtonText
    	    });
    	
    	this.form = Ext.create('Ext.form.Panel', {
    	    width: 400,
    	    bodyPadding: 10,
    	    border: false,
    	    items: [{
    	    	html: i18n("Select a file to upload or enter an URL to load the file from"),
    	    	border: false,
    	    	style: "margin-bottom: 20px;"
    	    },
    	    this.fileField,
    	    {
    	    	html: sprintf(i18n("Maximum upload size: %s"), PartKeepr.bytesToSize(PartKeepr.getMaxUploadSize())),
    	    	style: 'margin-bottom: 10px;',
    	    	border: false
    	    },
    	    this.urlField],

    	    buttons: this.tbButtons
    	});
    	
    	this.on("beforedestroy", this.onBeforeDestroy, this);
    	
    	this.items = this.form;
    	this.callParent();
    },
    /**
     * Shows a tooltip for all available image formats.
     */
    showAvailableFormats: function () {
    	if (!this.tip) {
    		this.tip = Ext.create("Ext.tip.ToolTip", {
        		title: i18n("Available Image Formats"),
        		anchor: 'left',
        		width: 200,
        		height: 300,
        		autoScroll: true,
        		target: this.fileFormatButton.getEl(),
        		closable: true,
        		html: implode("<br>", PartKeepr.getAvailableImageFormats()),
        		autoHide: false
        	});	
    	}
    	
    	
    	this.tip.show();
    },
    onBeforeDestroy: function () {
    	if (this.tip) {
    		this.tip.destroy();	
    	}
    }
});

/**
 * Represents an exception window.
 */
Ext.define('PartKeepr.ExceptionWindow', {
    extend: 'Ext.window.Window',
    resizable: true,
    layout: 'fit',
    width: 500,
    autoHeight: true,
    maxHeight: 800,
    cls: Ext.baseCSSPrefix + 'message-box',
    
    initComponent: function () {
    	
    	this.iconComponent = Ext.create('Ext.Component', {
            cls: 'ext-mb-icon',
            width: 40,
            height: 35,
            style: {
                'float': 'left'
            }
        });
    	
    	this.messageDiv = Ext.create('Ext.Component', {                            autoEl: { tag: 'div' },
            cls: 'ext-mb-text',
            style: 'margin-left: 40px;'
        });
    	
    	this.detailDiv = Ext.create('Ext.Component', {                            autoEl: { tag: 'div' },
            cls: 'ext-mb-text',
            style: 'margin-left: 40px; margin-top: 20px;'
        });
    	
    	this.exceptionDetails = Ext.create('Ext.form.field.TextArea', {
    		fieldLabel: i18n("Exception Details"),
    		flex: 1,
    		minHeight: 65,
    		readOnly: true
        });
    	
    	this.backtraceDetails = Ext.create('Ext.form.field.TextArea', {
    		fieldLabel: i18n("Backtrace"),
    		flex: 1,
    		minHeight: 65,
    		readOnly: true
    	});
    	
    	this.requestDetails = Ext.create('Ext.form.field.TextArea', {
    		fieldLabel: i18n("Request"),
    		flex: 1,
    		minHeight: 65,
    		readOnly: true
        });
    	
    	this.responseDetails = Ext.create('Ext.form.field.TextArea', {
    		fieldLabel: i18n("Response"),
    		flex: 1,
    		minHeight: 65,
    		readOnly: true
        });
    		
    	this.basicTab = Ext.create("Ext.panel.Panel", {
    		style: 'padding: 10px',
    		layout: 'anchor',
    		anchor: '100% 100%',
    		title: i18n("Basic"),
    		items: [this.iconComponent, this.messageDiv, this.detailDiv ]
    	});
    	
    	this.detailTab = Ext.create("Ext.form.Panel", {
    		style: 'padding: 10px',
    		layout: 'anchor',
    		autoScroll: true,
    		title: i18n("Detail"),
    		items: [{
    			xtype: 'panel',
    			height: 300,
    			border: false,
    			layout: {
        		    type: 'vbox',
        		    align : 'stretch',
        		    pack  : 'start'
        		},
    			items: [ this.exceptionDetails, this.backtraceDetails, this.requestDetails, this.responseDetails ]
    		}]
    	});
    	
    	this.fullReport = Ext.create("Ext.form.field.TextArea", {
    		readOnly: true,
    		height: 300
    	});
    	
    	this.backtraceTab = Ext.create("Ext.panel.Panel", {
    		style: 'padding: 10px',
    		layout: 'fit',
    		anchor: '100% 100%',
    		title: i18n("Full Report"),
    		items: [ this.fullReport ]
    	});
    	
    	this.topContainer = Ext.create("Ext.tab.Panel", {
    		items: [ this.basicTab, this.detailTab, this.backtraceTab ]
    	});
    	
    	this.items = this.topContainer;
    	
    	this.dockedItems = [{
            xtype: 'toolbar',
            dock: 'bottom',
            ui: 'footer',
            defaults: {minWidth: 80},
            layout: {
                pack: 'center'
            },
            items: [
                { xtype: 'button', text: 'OK', handler: Ext.bind(function () { this.hide(); }, this) }
            ]
        }];
    	
    	this.callParent();
    },
    setIcon : function(icon) {
        this.iconComponent.removeCls(this.iconCls);
        
        if (icon) {
            this.iconComponent.show();
            this.iconComponent.addCls(Ext.baseCSSPrefix + 'dlg-icon');
            this.iconComponent.addCls(icon);
        } else {
            this.iconComponent.removeCls(Ext.baseCSSPrefix + 'dlg-icon');
            this.iconComponent.hide();
        }
    },
    /**
     * Private. Updates the exception dialog with the exception data.
     * 
     * @see showException
     * 
     * @param exception The exception data
     * @param requestData The request data
     */
    _showException: function (exception, requestData) {
    	var separator = "==================================";
    	
    	this.setIcon(Ext.MessageBox.ERROR);
    	
    	this.messageDiv.update(exception.message);
    	this.setTitle(exception.message);
    	
    	var fullDetails = exception.message;
    	
    	if (exception.detail) {
    		fullDetails += "\n\n"+i18n("Details")+"\n"+separator+"\n";
    		fullDetails += exception.detail;
    		
    		this.detailDiv.update(exception.detail);
    	} else {
    		this.detailDiv.update("");
    	}
    	
    	
    	if (exception.exception) {
    		fullDetails += "\n\n"+i18n("Exception")+"\n"+separator+"\n";
    		fullDetails += exception.exception;
    		
    		this.exceptionDetails.setValue(exception.exception);
    	} else {
    		this.exceptionDetails.setValue("No information available");
    	}
    	
    	if (exception.backtrace) {
    		fullDetails += "\n\n"+i18n("Backtrace")+"\n"+separator+"\n";
    		fullDetails += exception.exception;
    		
    		this.backtraceDetails.setValue(nl2br(exception.backtrace));
    	} else {
    		this.backtraceDetails.setValue("No backtrace available");
    	}
    	
    	if (requestData.request) {
    		fullDetails += "\n\n"+i18n("Request")+"\n"+separator+"\n";
    		fullDetails += requestData.request;
    		
    		this.requestDetails.setValue(nl2br(requestData.request));
    	} else {
    		this.requestDetails.setValue("No server request information available");
    	}
    	
    	if (requestData.response) {
    		fullDetails += "\n\n"+i18n("Response")+"\n"+separator+"\n";
    		fullDetails += requestData.response;
    		
    		this.responseDetails.setValue(nl2br(requestData.response));
    	} else {
    		this.responseDetails.setValue("No server response information available");
    	}
    	
    	fullDetails += "\n\n"+i18n("Server Configuration")+"\n"+separator+"\n";
    	
    	for (var j in window.parameters) {
    		fullDetails += j+": " + window.parameters[j]+"\n"; 
    	}
    	
    	this.fullReport.setValue(fullDetails);
    	
    	this.show();
    	this.topContainer.layout.setActiveItem(0);
    	this.doLayout();
    },
    
    statics: {
    	/**
    	 * Displays the exception window.
    	 * 
    	 * The exception object may contain the following members:
    	 * - message:   The message to display    [mandatory]
    	 * - detail:    Details about the message [optional]
    	 * - exception: Exception details         [optional]
    	 * - backtrace: The backtrace             [optional]
    	 * 
    	 * The request data object may contain the following members:
    	 * - request:  The request data
    	 * - response: The response data
    	 *  
    	 * Any members specified are strings. Any other data type is not supported.
    	 *  
    	 * @param exception 	The exception object 
    	 * @param requestData	The request data
    	 */
    	showException: function (exception, requestData) {
    		if (!PartKeepr.ExceptionWindow.activeInstance) {
        		PartKeepr.ExceptionWindow.activeInstance = new PartKeepr.ExceptionWindow();
        	}
    		
    		PartKeepr.ExceptionWindow.activeInstance._showException(exception, requestData);
    	}
    	
    }
});
/**
 * This is a hackish bugfix for ExtJS 4.0.7. According to sencha, this has been fixed in EXTJSIV-4312. Remove this
 * as soon as a newer version as ExtJS 4.0.7 is out and fixes this bug.
 */
Ext.override(Ext.selection.RowModel, {
	onLastFocusChanged: function(oldFocused, newFocused, supressFocus) {
		if (this.views && this.views.length) {
			this.callOverridden(arguments);
		}
	},
	onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
		if (this.views && this.views.length) {
			this.callOverridden(arguments);
		}
	}
	
});
/**
 * This is a hackish bugfix for ExtJS 4.0.7. According to sencha, this has been fixed in EXTJSIV-3318. Remove this
 * as soon as a newer version as ExtJS 4.0.7 is out and fixes this bug.
 */
Ext.override(Ext.grid.plugin.CellEditing, {

	startEdit: function(record, columnHeader) {
        var me = this,
            value = record.get(columnHeader.dataIndex),
            context = me.getEditingContext(record, columnHeader),
            ed;

        record = context.record;
        columnHeader = context.column;

        
        
        me.completeEdit();

        context.originalValue = context.value = value;
        if (me.beforeEdit(context) === false || me.fireEvent('beforeedit', context) === false || context.cancel) {
            return false;
        }
        
        
        if (columnHeader && (!columnHeader.getEditor || !columnHeader.getEditor(record))) {
            return false;
        }
        
        ed = me.getEditor(record, columnHeader);
        if (ed) {
            me.context = context;
            me.setActiveEditor(ed);
            me.setActiveRecord(record);
            me.setActiveColumn(columnHeader);

            
            me.editTask.delay(15, ed.startEdit, ed, [me.getCell(record, columnHeader), value]);
        } else {
            
            
            
            
            me.grid.getView().getEl(columnHeader).focus((Ext.isWebKit || Ext.isIE) ? 10 : false);
        }
        
        return true;
    }
});
/**
 * Bugfix for Ext.panel.Table:
 * 
 * Set the scrollDelta to 100 to ensure better scrolling experience
 */
Ext.override(Ext.panel.Table, {
	scrollDelta: 100
});

Ext.override(Ext.grid.feature.Grouping, {
            collapseAll: function() {
                var self = this, view = self.view;
                view.el.query('.x-grid-group-hd').forEach(function (group) {
                    var group_body = Ext.fly(group.nextSibling, '_grouping');
                    self.collapse(group_body);
                });
            },

            expandAll: function() {
                var self = this, view = self.view;
                view.el.query('.x-grid-group-hd').forEach(function (group) {
                    var group_body = Ext.fly(group.nextSibling, '_grouping');
                    self.expand(group_body);
                });
            }
        });
/**
 * Enhancements for Ext.layout.component.field.Trigger:
 * 
 * Adjust the rendering so our custom theme works pretty.
 */
Ext.override(Ext.layout.component.field.Trigger, {
    sizeBodyContents: function(width, height) {
        var me = this,
            owner = me.owner,
            inputEl = owner.inputEl,
            triggerWrap = owner.triggerWrap,
            triggerWidth = owner.getTriggerWidth();

        // If we or our ancestor is hidden, we can get a triggerWidth calculation
        // of 0.  We don't want to resize in this case.
        if (owner.hideTrigger || owner.readOnly || triggerWidth > 0) {
            // Decrease the field's width by the width of the triggers. Both the field and the triggerWrap
            // are floated left in CSS so they'll stack up side by side.
            me.setElementSize(inputEl, Ext.isNumber(width) ? width  : width);
    
            inputEl.dom.style.paddingRight = (triggerWidth+2)+"px";
            // Explicitly set the triggerWrap's width, to prevent wrapping
            triggerWrap.setWidth(triggerWidth);
        }
    }
});

Ext.override(Ext.data.reader.Json, {
	getResponseData: function(response) {
        var data;
        try {
            data = Ext.decode(response.responseText);
        }
        catch (ex) {
        	var exception = {
        			message: i18n("Critical Error"),
        			detail: i18n("The server returned a response which we were not able to interpret.")
        	};
        	
        	var request = {
        			response: response.responseText
        	};
        	
        	PartKeepr.ExceptionWindow.showException(exception, request);
        }

        return data;
    }
});
/**
 * Enhancements for Ext.tree.View:
 * 
 * Ported ensureVisible and scrollIntoView from ExtJS3
 */
Ext.override(Ext.tree.View, {
	/**
     * Expands all parent nodes so the child is visible.
     * @param {Ext.data.Model} record The record to make visible
     */
	ensureVisible: function (record) {
		if (!record) { return; }
		
		if (record.parentNode) {
			record.parentNode.expand();
			this.ensureVisible(record.parentNode);
		}
	},
	/**
     * Scrolls the specified record node into view
     * @param {Ext.data.Model} record The record to scroll into view
     */
	scrollIntoView: function (record) {
		var node = this.getNode(record);

		if (node) {
			node.scrollIntoView(this.getEl());
		}
	}
});
/**
 * Enhancements for Ext.data.Connection:
 * 
 * Inject the session automatically on each request if a
 * session is available.
 */
Ext.override(Ext.data.Connection, {
	/**
	 * Inject session header. I haven't found a better way to do
	 * it :(
	 */
	setupHeaders: function (xhr, options, data, params) {
		var session;
		
		if (!options.headers) {
			options.headers = {};
		}
		
		if (PartKeepr.getApplication() !== null) {
			session = PartKeepr.getApplication().getSession();
			if (session !== null) {
				options.headers.session = session;
			}
		}
		
		var headers = this.callOverridden(arguments);
		
		return headers;
	}

});
Ext.define('Ext.ux.form.SearchField', {
    extend: 'Ext.form.field.Trigger',
    
    alias: 'widget.searchfield',
    
    trigger1Cls: Ext.baseCSSPrefix + 'form-clear-trigger',
    
    trigger2Cls: Ext.baseCSSPrefix + 'form-search-trigger',
    
    hasSearch : false,
    paramName : 'query',
    
    initComponent: function(){
        this.callParent(arguments);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();
            }
        }, this);
    },
    
    afterRender: function(){
        this.callParent();
        this.triggerEl.item(0).setDisplayed('none');
        this.doComponentLayout();
    },
    
    onTrigger1Click : function(){
        var me = this,
            store = me.store,
            proxy = store.getProxy(),
            val;
            
        if (me.hasSearch) {
            me.setValue('');
            proxy.extraParams[me.paramName] = '';
            store.currentPage = 1;
            store.load({ start: 0 });
            me.hasSearch = false;
            
            me.triggerEl.item(0).setDisplayed('none');
            me.doComponentLayout();
        }
    },

    onTrigger2Click : function(){
        var me = this,
            store = me.store,
            proxy = store.getProxy(),
            value = me.getValue();
            
        if (value.length < 1) {
            me.onTrigger1Click();
            return;
        }
        proxy.extraParams[me.paramName] = value;
        store.currentPage = 1;
        store.load({ start: 0 });
        
        me.hasSearch = true;
        me.triggerEl.item(0).setDisplayed('block');
        me.doComponentLayout();
    }
});
Ext.define('Ext.ux.ClearableComboBox', {
	extend: "Ext.form.ComboBox",
	alias: "widget.clearcombo",
    initComponent: function() {
        this.triggerConfig = {
            tag:'span', cls:'x-form-twin-triggers', cn:[
            {tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger x-form-clear-trigger"},
            {tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger"}
        ]};
        
        this.callParent();
    },
    onTrigger1Click : function()
    {
        this.collapse();
        this.setValue('');
        this.fireEvent('cleared');
    },
    setValue : function(v){
	Ext.form.ClearableComboBox.superclass.setValue.call(this, v);
	if (this.rendered) {
		this.triggers[0][!Ext.isEmpty(v) ? 'show': 'hide']();
	}
    },
    onDestroy: function(){
        Ext.destroy(this.triggers);
        Ext.form.ClearableComboBox.superclass.onDestroy.apply(this, arguments);
    }
});

// vim: sw=2:ts=2:nu:nospell:fdc=2:expandtab
/**
* @class Ext.ux.SimpleIFrame
* @extends Ext.Panel
*
* A simple ExtJS 4 implementaton of an iframe providing basic functionality.
* For example:
*
* var panel=Ext.create('Ext.ux.SimpleIFrame', {
*   border: false,
*   src: 'http://localhost'
* });
* panel.setSrc('http://www.sencha.com');
* panel.reset();
* panel.reload();
* panel.getSrc();
* panel.update('<div><b>Some Content....</b></div>');
* panel.destroy();
*
* @author    Conor Armstrong
* @copyright (c) 2011 Conor Armstrong
* @date      12 April 2011
* @version   0.1
*
* @license Ext.ux.SimpleIFrame.js is licensed under the terms of the Open Source
* LGPL 3.0 license. Commercial use is permitted to the extent that the 
* code/component(s) do NOT become part of another Open Source or Commercially
* licensed development library or toolkit without explicit permission.
* 
* <p>License details: <a href="http://www.gnu.org/licenses/lgpl.html"
* target="_blank">http://www.gnu.org/licenses/lgpl.html</a></p>
*
*/

Ext.require([
	'Ext.panel.*'
]);

Ext.define('Ext.ux.SimpleIFrame', {
  extend: 'Ext.Panel',
  alias: 'widget.simpleiframe',
  src: 'about:blank',
  loadingText: 'Loading ...',
  initComponent: function(){
    this.updateHTML();
    this.callParent(arguments);
  },
  updateHTML: function() {
    this.html='<iframe id="iframe-'+this.id+'"'+
        ' style="overflow:auto;width:100%;height:100%;"'+
        ' frameborder="0" '+
        ' src="'+this.src+'"'+
        '></iframe>';
  },
  reload: function() {
    this.setSrc(this.src);
  },
  reset: function() {
    var iframe=this.getDOM();
    var iframeParent=iframe.parentNode;
    if (iframe && iframeParent) {
      iframe.src='about:blank';
      iframe.parentNode.removeChild(iframe);
    }

    iframe=document.createElement('iframe');
    iframe.frameBorder=0;
    iframe.src=this.src;
    iframe.id='iframe-'+this.id;
    iframe.style.overflow='auto';
    iframe.style.width='100%';
    iframe.style.height='100%';
    iframeParent.appendChild(iframe);
  },
  setSrc: function(src, loadingText) {
    this.src=src;
    var iframe=this.getDOM();
    if (iframe) {
      iframe.src=src;
    }
  },
  getSrc: function() {
    return this.src;
  },
  getDOM: function() {
    return document.getElementById('iframe-'+this.id);
  },
  getDocument: function() {
    var iframe=this.getDOM();
    iframe = (iframe.contentWindow) ? iframe.contentWindow : (iframe.contentDocument.document) ? iframe.contentDocument.document : iframe.contentDocument;
    return iframe.document;
  },
  destroy: function() {
    var iframe=this.getDOM();
    if (iframe && iframe.parentNode) {
      iframe.src='about:blank';
      iframe.parentNode.removeChild(iframe);
    }
    this.callParent(arguments);
  },
  update: function(content) {
	var doc;
	  
    this.setSrc('about:blank');
    try {
      doc=this.getDocument();
      doc.open();
      doc.write(content);
      doc.close();
    } catch(err) {
      // reset if any permission issues
      this.reset();
      doc=this.getDocument();
      doc.open();
      doc.write(content);
      doc.close();
    }
  }
});
Ext.define("PartKeepr.PartUnit", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'name',	type: 'string'},
	         {	name: 'shortName',	type: 'string'},
	         {	name: 'default',	type: 'bool'}
	         ],
	proxy: PartKeepr.getRESTProxy("PartUnit"),
	getRecordName: function () {
		return this.get("name");
	}
});
Ext.define("PartKeepr.ManufacturerICLogo", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',		type: 'string' },
	         {	name: 'originalFilename',	type: 'string' },
	         {	name: 'footprint_id',		type: 'int' },
	         {	name: 'mimetype',			type: 'string' },
	         {	name: 'extension',			type: 'string' },
	         {	name: 'description',		type: 'string' },
	         {	name: 'size',				type: 'string' }
	         ],
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Manufacturer', primaryKey: 'id', foreignKey: 'manufacturer_id'},
	proxy: PartKeepr.getRESTProxy("ManufacturerICLogo")
});
Ext.define("PartKeepr.PartParameter", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'part_id',			type: 'int' },
	         {	name: 'name',			type: 'string' },
	         {	name: 'description',			type: 'string' },
	         {	name: 'unit_id',			type: 'int' },
	         {	name: 'siprefix_id',		type: 'int' },
	         {  name: 'value', type: 'float' },
	         {  name: 'prefixedValue' }
	         ],
	proxy: PartKeepr.getRESTProxy("PartParameter")
});

Ext.define("PartKeepr.FootprintAttachment", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',		type: 'string' },
	         {	name: 'originalFilename',	type: 'string' },
	         {	name: 'footprint_id',		type: 'int' },
	         {	name: 'mimetype',			type: 'string' },
	         {	name: 'extension',			type: 'string' },
	         {	name: 'description',		type: 'string' },
	         {	name: 'size',				type: 'string' }
	         ],
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Footprint', primaryKey: 'id', foreignKey: 'footprint_id'},
	proxy: PartKeepr.getRESTProxy("FootprintAttachment")
});
Ext.define("PartKeepr.Footprint", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',	type: 'int' 	},
	         {	name: 'name',			type: 'string'	},
	         {	name: 'description',	type: 'string'	},
		     // image_id needs to be a string because we need to be able to push TMP:<id> back
	         {	name: 'image_id',		type: 'string'	},
	         {	name: 'category',	type: 'int'	}
	         ],
	hasMany: {model: 'PartKeepr.FootprintAttachment', name: 'attachments'},
	proxy: PartKeepr.getRESTProxy("Footprint"),
	getRecordName: function () {
		return this.get("name");
	}
});

Ext.define("PartKeepr.PartManufacturer", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'part_id',			type: 'int' },
	         {	name: 'part_name',			type: 'string' },
	         {	name: 'manufacturer_id',			type: 'int' },
	         {	name: 'manufacturer_name',			type: 'string' },
	         { name: 'partNumber', type: 'string' }
	         ],
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Part', primaryKey: 'id', foreignKey: 'part_id'},
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Manufacturer', primaryKey: 'id', foreignKey: 'manufacturer_id'},
	proxy: PartKeepr.getRESTProxy("PartManufacturer")
});

Ext.define("PartKeepr.UserPreference", {
	extend: "Ext.data.Model",
	fields: [
	         {	name: 'key',	type: 'string'},
	         {	name: 'value'},
	         {  name: 'user_id', type: 'int'}
	        ],
	proxy: PartKeepr.getRESTProxy("UserPreference")
});
Ext.define("PartKeepr.SiPrefix", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id', type: 'int' },
	         {	name: 'prefix',	type: 'string'},
	         {	name: 'symbol',	type: 'string'},
	         {	name: 'power',	type: 'int'}
	         ],
	proxy: PartKeepr.getRESTProxy("SiPrefix")
});
/**
 * Represents a project report list
 */
Ext.define("PartKeepr.ProjectReportList", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'name',	type: 'string'},
	         {	name: 'description',	type: 'string'},
	         {	name: 'user_id',	type: 'int'},
	         {	name: 'amount',	type: 'int', defaultValue: 1 }
	         ],
	hasMany: [
		{ model: 'PartKeepr.ProjectPart', 	name: 'parts'},
		{ model: 'PartKeepr.ProjectAttachment', name: 'attachments' }
		],
	proxy: PartKeepr.getRESTProxy("Project"),
	getRecordName: function () {
		return this.get("name");
	}
});
Ext.define("PartKeepr.Unit", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id', type: 'int' },
	         {	name: 'name',	type: 'string'},
	         {	name: 'symbol',	type: 'string'}
	         ],
    hasMany: { model: 'PartKeepr.SiPrefix', name: 'prefixes'},
	proxy: PartKeepr.getRESTProxy("Unit"),
	getRecordName: function () {
		return this.get("name");
	}
});
Ext.define("PartKeepr.Part", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',		type: 'int' },
	         {	name: 'category',			type: 'int'},
	         {	name: 'footprint',			type: 'int'},
	         {	name: 'storageLocation',	type: 'int'},
	         {	name: 'partUnit',			type: 'int'},
	         {	name: 'averagePrice',		type: 'float'},
	         {	name: 'name',				type: 'string'},
	         {	name: 'comment',			type: 'string'},
	         {	name: 'status',				type: 'string'},
	         {	name: 'stockLevel',			type: 'int'},
	         {	name: 'minStockLevel',		type: 'int'},
	         {	name: 'createDate',			type: 'datetime'},
	         {	name: 'needsReview',		type: 'boolean'},
	         
	         // Various things that don't belong to the part, but are transmitted anyways to make handling easier
	         {	name: 'initialStockLevel',		type: 'int'},
	         {	name: 'initialStockLevelUser',	type: 'int'},
	         {	name: 'initialStockLevelPrice',	type: 'float'},
	         {	name: 'initialStockLevelPricePerItem',	type: 'boolean'},
	         {	name: 'partUnitName',		type: 'string'},
	         {	name: 'footprintName',		type: 'string'},
	         {	name: 'storageLocationName',type: 'string'},
	         {	name: 'categoryName',		type: 'string'},
	         {	name: 'categoryPath',		type: 'string'},
	         {	name: 'attachmentCount',	type: 'int'},
	         {
	        	 name: 'partUnitDefault',
	        	 type: 'boolean',
	        	 convert: function (val) {
	        		 if (val === "true" || val === "1" || val === true)
	        		 { return true; }
	        		 else { return false; }
	        		 }
	         }
	         
	         ],
    belongsTo: [
                { model: 'PartKeepr.StorageLocation', 	primaryKey: 'id', 	foreignKey: 'storageLocation'},
                { model: 'PartKeepr.Footprint', 		primaryKey: 'id', 	foreignKey: 'footprint'},
                { model: 'PartKeepr.PartCategory', 		primaryKey: 'id', 	foreignKey: 'category'}
                ],
    hasMany: [
              { model: 'PartKeepr.PartDistributor', 	name: 'distributors'},
              { model: 'PartKeepr.PartManufacturer', 	name: 'manufacturers'},
              { model: 'PartKeepr.PartParameter', 		name: 'parameters'},
              { model: 'PartKeepr.PartAttachment', 		name: 'attachments'}
              ],
	proxy: PartKeepr.getRESTProxy("Part"),
	getRecordName: function () {
		return this.get("name");
	}
});

/**
 * Represents a project report
 */
Ext.define("PartKeepr.ProjectReport", {
	extend: "Ext.data.Model",
	fields: [
	         {	name: 'quantity',	type: 'int'},
	         {	name: 'storageLocation_name',	type: 'string'},
	         {	name: 'available',	type: 'int'},
	         {	name: 'missing',	type: 'int'},
	         {	name: 'distributor_order_number',	type: 'string'},
	         {	name: 'sum_order',	type: 'float'},
	         {	name: 'sum',	type: 'float'},
	         {	name: 'projects',	type: 'string'},
	         {	name: 'remarks',	type: 'string'}
	         ],
	hasMany: [
		{ model: 'PartKeepr.Part', 	name: 'part'}
		],
	proxy: PartKeepr.getRESTProxy("ProjectReport")
});
/**
 * Represents a system notice
 */
Ext.define("PartKeepr.SystemNotice", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'date',	type: 'date', dateFormat: 'Y-m-d H:i:s'},
	         {	name: 'title',	type: 'string'},
	         {	name: 'description',	type: 'string'}
	         ],
	proxy: PartKeepr.getRESTProxy("SystemNotice"),
	getRecordName: function () {
		return this.get("title");
	}
});
/**
 * Defines a system information record
 */
Ext.define("PartKeepr.SystemInformationRecord", {
	extend: "Ext.data.Model",
	fields: [
	         /* Defines the name of the property */
	         {	name: 'name',				type: 'string' },
	         /* Defines the value of the property */
	         {	name: 'value',				type: 'string' },
	         /* Defines the category of the property */
	         {	name: 'category',			type: 'string' }
	         ]
});
Ext.define("PartKeepr.ProjectAttachment", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',		type: 'string' },
	         {	name: 'originalFilename',	type: 'string' },
	         {	name: 'project_id',			type: 'int' },
	         {	name: 'mimetype',			type: 'string' },
	         {	name: 'extension',			type: 'string' },
	         {	name: 'description',		type: 'string' },
	         {	name: 'size',				type: 'string' }
	         ],
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Project', primaryKey: 'id', foreignKey: 'project_id'},
	proxy: PartKeepr.getRESTProxy("ProjectAttachment")
});
Ext.define("PartKeepr.Distributor", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'name',	type: 'string'},
	         {	name: 'url',	type: 'string'},
	         {	name: 'comment',	type: 'string'},
	         {	name: 'address',	type: 'string'},
	         {	name: 'phone',	type: 'string'},
	         {	name: 'fax',	type: 'string'},
	         {	name: 'email',	type: 'string'}
	         ],
	proxy: PartKeepr.getRESTProxy("Distributor"),
	getRecordName: function () {
		return this.get("name");
	}
});
/**
 * Represents a project
 */
Ext.define("PartKeepr.Project", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'name',	type: 'string'},
	         {	name: 'description',	type: 'string'},
	         {	name: 'user_id',	type: 'int'}
	         ],
	hasMany: [
		{ model: 'PartKeepr.ProjectPart', 	name: 'parts'},
		{ model: 'PartKeepr.ProjectAttachment', name: 'attachments' }
		],
	proxy: PartKeepr.getRESTProxy("Project"),
	getRecordName: function () {
		return this.get("name");
	}
});
Ext.define("PartKeepr.Message", {
	extend: "Ext.data.Model",
	fields: [
	         {	name: 'message', type: 'string' },
	         {	name: 'severity',	type: 'string'},
	         { name: 'date', type: 'date' }
	         ]
});
Ext.define("PartKeepr.TipOfTheDay", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id', type: 'int' },
	         {	name: 'name',	type: 'string'},
	         {	name: 'url',	type: 'string'},
	         {  name: 'read', type: 'boolean' }
	         ],
	proxy: PartKeepr.getRESTProxy("TipOfTheDay")
});
/**
 * Represents a project part
 */
Ext.define("PartKeepr.ProjectPart", {
	extend: "Ext.data.Model",
	fields: [
	         {
	        	 id: 'id',
	        	 name: 'id',
	        	 type: 'int'
			},
	         {	name: 'project_id',	type: 'int'},
	         {	name: 'part_id',	type: 'int'},
	         {	name: 'part_name',	type: 'string'},
	         {	name: 'quantity',	type: 'int'},
	         {	name: 'remarks',	type: 'string'}
	         
	         ],
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Project', primaryKey: 'id', foreignKey: 'project_id'},
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Part', primaryKey: 'id', foreignKey: 'part_id'},
	proxy: PartKeepr.getRESTProxy("ProjectPart")
});
Ext.define("PartKeepr.User", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'username',	type: 'string'},
	         {	name: 'password',	type: 'string'}
	         ],
	proxy: PartKeepr.getRESTProxy("User"),
	getRecordName: function () {
		return this.get("username");
	}
});
Ext.define("PartKeepr.StockEntry", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'username',	type: 'string'},
	         {	name: 'user_id',	type: 'int'},
	         {	name: 'dateTime',	type: 'datetime'},
	         {	name: 'stockLevel',	type: 'int'},
	         {	name: 'storageLocation_name',	type: 'string'},
	         {	name: 'direction',	type: 'string'},
	         {	name: 'part_name',	type: 'string'},
	         {	name: 'price',		type: 'float'},
	         {	name: 'comment',	type: 'string'}
	         ]
});
Ext.define("PartKeepr.AbstractCategory", {
	extend: "Ext.data.Model",
	isCategory: true
});


Ext.define("PartKeepr.FootprintCategory", {
	extend: "PartKeepr.AbstractCategory",
	fields: [
	         {	name: 'id',	type: 'int' },
	         {	name: 'name',	type: 'string' },
	         {  name: 'description', type: 'string' },
	         {  name: 'parent', type: 'int' }
	         ],
    proxy: PartKeepr.getRESTProxy("FootprintCategory"),
    getRecordName: function () {
    	return this.get("name");
    }
});


Ext.define("PartKeepr.PartCategory", {
	extend: "PartKeepr.AbstractCategory",
	fields: [
	         {	name: 'id',	type: 'int' },
	         {	name: 'name',	type: 'string' },
	         {  name: 'description', type: 'string' },
	         {  name: 'parent', type: 'int' }
	         ],
    proxy: PartKeepr.getRESTProxy("PartCategory"),
    getRecordName: function () {
    	return this.get("name");
    }
});


Ext.define("PartKeepr.StatisticSample", {
	extend: "Ext.data.Model",
	fields: [
	         {	name: 'start',	type: 'date', dateFormat: 'Y-m-d H:i:s'},
	         {	name: 'parts',	type: 'int', useNull: true },
	         {	name: 'categories',	type: 'int', useNull: true }
	         ]
});
Ext.define("PartKeepr.PartDistributor", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'part_id',			type: 'int' },
	         {	name: 'part_name',			type: 'string' },
	         {	name: 'distributor_id',			type: 'int' },
	         {	name: 'distributor_name',			type: 'string' },
	         {	name: 'price',			type: 'float' },
	         { name: 'orderNumber', type: 'string' },
	         { name: 'packagingUnit', type: 'int'}
	         ],
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Part', primaryKey: 'id', foreignKey: 'part_id'},
	belongsTo: { type: 'belongsTo', model: 'PartKeepr.Distributor', primaryKey: 'id', foreignKey: 'distributor_id'},
	proxy: PartKeepr.getRESTProxy("PartDistributor")
});
Ext.define("PartKeepr.Manufacturer", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'name',	type: 'string'},
	         {	name: 'url',	type: 'string'},
	         {	name: 'comment',	type: 'string'},
	         {	name: 'address',	type: 'string'},
	         {	name: 'phone',	type: 'string'},
	         {	name: 'fax',	type: 'string'},
	         {	name: 'email',	type: 'string'}
	         ],
	hasMany: {model: 'PartKeepr.ManufacturerICLogo', name: 'iclogos'},
	proxy: PartKeepr.getRESTProxy("Manufacturer"),
	getRecordName: function () {
		return this.get("name");
	}
});
Ext.define("PartKeepr.StorageLocation", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',			type: 'int' },
	         {	name: 'name',	type: 'string'},
		     // image_id needs to be a string because we need to be able to push TMP:<id> back
	         {	name: 'image_id',		type: 'string'	}
			],
	proxy: PartKeepr.getRESTProxy("StorageLocation"),
	getRecordName: function () {
		return this.get("name");
	}
});
Ext.define("PartKeepr.PartAttachment", {
	extend: "Ext.data.Model",
	fields: [
	         {	id: 'id', name: 'id',		type: 'string' },
	         {	name: 'originalFilename',	type: 'string' },
	         {	name: 'footprint_id',		type: 'int' },
	         {	name: 'mimetype',			type: 'string' },
	         {	name: 'extension',			type: 'string' },
	         {	name: 'description',		type: 'string' },
	         {	name: 'size',				type: 'string' }
	         ],
	         belongsTo: { type: 'belongsTo', model: 'PartKeepr.Part', primaryKey: 'id', foreignKey: 'part_id'},
	proxy: PartKeepr.getRESTProxy("PartAttachment")
});

Ext.define('PartKeepr.ServiceCall', {
	extend: 'Ext.util.Observable',
	
	service: null,
	call: null,
	
	sHandler: null,
	parameters: {},
	loadMessage: null,
	anonymous: false,

	constructor: function (service,call) {
		this.setService(service);
		this.setCall(call);
		this.parameters = {};
	},
	
	/**
	 * <p>This method activates anonymous mode.</p>
	 * <p>Anonymous mode defines that the service is called without passing a valid session. Usually, the only anonymous call is to authenticate a user.</p>
	*/
	enableAnonymous: function () {
		this.anonymous = true;
	},
	/**
	 * <p>This method deactivates anonymous mode.</p>
 	*/
	disableAnonymous: function () {
		this.anonymous = false;
	},
	setService: function (service) {
		this.service = service;
	},
	setCall: function (call) {
		this.call = call;
	},
	setParameter: function (parameter, value) {
		this.parameters[parameter] = value;
	},
	setParameters: function (obj) {
		Ext.apply(this.parameters, obj);
	},
	setLoadMessage: function (message) {
		this.loadMessage = message;
	},
	setHandler: function (handler) {
		this.sHandler = handler;
	},
	doCall: function () {
		/* Update the status bar to indicate that the call is in progress. */
		PartKeepr.getApplication().getStatusbar().startLoad(this.loadMessage);
		
		var callDefinition = Ext.encode(this.parameters);
		
		var headers = {
			"call": this.call,
			"lang": Ext.getLocale()
		};
		
		if (!this.anonymous) {
			headers.session = PartKeepr.getApplication().getSessionManager().getSession();
		}
		
		Ext.Ajax.request({
			url: PartKeepr.getBasePath() + '/' + this.service + "/"+this.call,
			success: Ext.bind(this.onSuccess, this),
			failure: Ext.bind(this.onError, this),
			method: "POST",
			params: callDefinition,
			headers: headers
		});
	},
	onSuccess: function (responseObj, options) {
		PartKeepr.getApplication().getStatusbar().endLoad();
		
		try {
			var response = Ext.decode(responseObj.responseText);	
		} catch (ex) {
			var exception = {
        			message: i18n("Critical Error"),
        			detail: i18n("The server returned a response which we were not able to interpret.")
        	};
        	
     	
			var request = {
        			response: responseObj.responseText,
        			request: Ext.encode(options)
        	};
			
        	PartKeepr.ExceptionWindow.showException(exception, request);
        	return;
		}
		
				
		/* Check the status */
		if (response.status == "error") {
			this.displayError(response.exception);
			PartKeepr.getApplication().getStatusbar().setStatus({
				text: this.getErrorMessage(response.exception),
				iconCls: 'x-status-error',
				clear: {
					useDefaults: true,
					anim: false
				}
			});
			return;
		}
		
		/* Check the status */
		if (response.status == "systemerror") {
			this.displaySystemError(response);
			PartKeepr.getApplication().getStatusbar().setStatus({
				text: this.getErrorMessage(response),
				iconCls: 'x-status-error',
				clear: {
					useDefaults: true,
					anim: false
				}
			});
    

			return;
		}
		
		
		
		if (this.sHandler) { 
			this.sHandler(response.response);
		}
	},
	onError: function (response, options) {
		var request;
		
		try {
            var data = Ext.decode(response.responseText);
            
            request = {
        			response: response.responseText,
        			request: Ext.encode(options)
        	};
            
        	PartKeepr.ExceptionWindow.showException(data.exception, request);
        } catch (ex) {
        	var exception = {
        			message: i18n("Critical Error"),
        			detail: i18n("The server returned a response which we were not able to interpret."),
        			backtrace: response.responseText
        	};
        	
        	request = {
        			response: response.responseText,
        			request: Ext.encode(options)
        	};
        	
        	PartKeepr.ExceptionWindow.showException(exception, request);
        	
        	
        }
        
		PartKeepr.getApplication().getStatusbar().endLoad();
	},
	displayError: function (obj) {
		Ext.Msg.show({
			title: i18n("Error"),
			msg: this.getErrorMessage(obj),
			buttons: Ext.MessageBox.OK,
			icon: Ext.MessageBox.ERROR
			
		});
	},
	getErrorMessage: function (obj) {
		var errorMsg;
		
		if (obj.message === "") {
			errorMsg = obj.exception;
		} else {
			errorMsg = obj.message;
		}
		
		return errorMsg;
	},
	displaySystemError: function (obj) {
		var errorMsg;

		errorMsg = "Error Message: " + obj.message+"<br>";
		errorMsg += "Exception:"+obj.exception+"<br>";
		errorMsg += "Backtrace:<br>"+str_replace("\n", "<br>", obj.backtrace);
		
		Ext.Msg.maxWidth = 800;
		
		Ext.Msg.show({
			title: i18n("System Error"),
			msg: errorMsg,
			buttons: Ext.MessageBox.OK,
			icon: Ext.MessageBox.ERROR
			
		});
	}
	
});
Ext.define('PartKeepr.Menu', {
	extend: 'Ext.toolbar.Toolbar',
	items: [{
		
	}]
});
/**
 * This class represents the tip of the day window and its logic.
 */
Ext.define("PartKeepr.TipOfTheDayWindow", {
	extend: 'Ext.window.Window',
	
	/* Defines the title template. */
	titleTemplate: i18n("Tip of the Day"),
	
	/* Cosmetic settings */
	width: 600,
	height: 300,
	
	minWidth: 600,
	minHeight: 300,
	
	layout: 'fit',
	
	/**
	 * Stores the currently displayed tip, or null if none is displayed
	 * @var Ext.data.Record
	 */
	currentTip: null,
	
	/**
	 * Holds an instance of the TipOfTheDay store.
	 */
	tipStore: null,
	
	/**
	 * Initializes the window. Adds the iframe used for displaying tips, as well
	 * as the user controls (prev/next buttons, config checkboxes).
	 */
	initComponent: function () {
		// Initialize the window with the title template
		this.title = this.titleTemplate;
		
		// Set the tip store
		this.tipStore = PartKeepr.getApplication().getTipOfTheDayStore();
		
		// Set the tip display iframe and add it to the items
		this.tipDisplay = Ext.create("Ext.ux.SimpleIFrame", {
			border: false
		});
		
		this.items = this.tipDisplay;

		// Initialize previous and next buttons
		this.previousButton = Ext.create("Ext.button.Button", {
			text: i18n("Previous Tip"),
        	handler: Ext.bind(this.displayPreviousTip, this),
        	icon: 'resources/icons/tip_previous.png',
        	disabled: true
		});
		
		this.nextButton = Ext.create("Ext.button.Button", {
			text: i18n("Next Tip"),
			icon: 'resources/icons/tip_next.png',
        	handler: Ext.bind(this.displayNextTip, this)
		});
		
		// Initializes the "show tips on login" checkbox as well as the "show read tips" checkbox
		this.showTipsCheckbox = Ext.create("Ext.form.field.Checkbox", {
			boxLabel: i18n("Show Tips on login"),
			handler: Ext.bind(this.showTipsHandler, this)
		});
		
		this.displayReadTipsCheckbox = Ext.create("Ext.form.field.Checkbox", {
			boxLabel: i18n("Show read tips"),
			handler: Ext.bind(this.showReadTipsHandler, this)
		});
		
		// Initialize the "show tips" checkbox with the user preference
		if (PartKeepr.getApplication().getUserPreference("partkeepr.tipoftheday.showtips") === false) {
			this.showTipsCheckbox.setValue(false);
		} else {
			this.showTipsCheckbox.setValue(true);
		}
		
		// Append the controls to the bottom toolbar
		this.dockedItems = [{
		    xtype: 'toolbar',
		    dock: 'bottom',
		    ui: 'footer',
		    defaults: {minWidth: 100},
		    pack: 'start',
		    items: [
		        this.previousButton,
		        this.nextButton,
		        '->',
		        this.showTipsCheckbox,
		        this.displayReadTipsCheckbox
		    ]
		}];
		
		// Auto-load the next unread tip on window display
		this.on("show", this.displayNextTip, this);
		
		// Window destroy handler
		this.on("destroy", this.onDestroy, this);
		this.callParent();
	},
	/**
	 * If the "show read tips" checkbox was clicked, update the buttons
	 * to reflect the tip navigation.
	 */
	showReadTipsHandler: function () {
		this.updateButtons(this.currentTip);
	},
	/**
	 * Destroy handler. Removes the "read tip" timer.
	 */
	onDestroy: function () {
		this.cancelReadTimer();
	},
	/**
	 * Cancels the read timer.
	 */
	cancelReadTimer: function () {
		if (this.markAsReadTask) {
			this.markAsReadTask.cancel();
		}
	},
	/**
	 * Handler when the "show tips" checkbox was clicked. 
	 */
	showTipsHandler: function (checkbox, checked) {
		PartKeepr.getApplication().setUserPreference("partkeepr.tipoftheday.showtips", checked);
	},
	/**
	 * Displays a specific tip of the day.
	 * @param record The record which contains the information regarding the tip
	 */
	displayTip: function (record) {
		// Cancel the old read timer
		this.cancelReadTimer();

		// Update buttons to reflect position
		this.updateButtons(record);
		
		// Set the title to the tip name
		this.setTitle(this.titleTemplate+ ": " + record.get("name"));
		
		// Set iframe to the tip url
		this.tipDisplay.setSrc(record.get("url"));
		
		// Fire up delayed task to mark the tip as read
		this.markAsReadTask = new Ext.util.DelayedTask(this.markTipRead, this);
		this.markAsReadTask.delay(5000);
		
	},
	/**
	 * Updates the navigation buttons.
	 * 
	 * This method has two modes, depending on which state the "show read tips" checkbox is in.
	 * @param record The currently displayed tip
	 */
	updateButtons: function (record) {
		if (this.displayReadTipsCheckbox.getValue() === true) {
			if (this.tipStore.indexOf(record) > 0) {
				this.previousButton.enable();
			} else {
				this.previousButton.disable();
			}
			
			if (this.tipStore.indexOf(record) === this.tipStore.getTotalCount() - 1) {
				this.nextButton.disable();
			} else {
				this.nextButton.enable();
			}	
		} else {
			if (this.tipStore.indexOf(record) > this.getFirstUnreadTip()) {
				this.previousButton.enable();
			} else {
				this.previousButton.disable();
			}
			
			
			if (this.tipStore.indexOf(record) >= this.getLastUnreadTip()) {
				this.nextButton.disable();
			} else {
				this.nextButton.enable();
			}	
		}
		
	},
	/**
	 * Returns the index of the first unread tip, or null if there's no unread tip.
	 * @returns int The index of the first unread tip, or null
	 */
	getFirstUnreadTip: function () {
		for (var i=0;i<this.tipStore.getTotalCount();i++) {
			if (this.tipStore.getAt(i).get("read") === false) {
				return i;
			}
		}
		
		return null;
	},
	/**
	 * Returns the index of the last unread tip, or null if there's no unread tip.
	 * @returns int The index of the last unread tip, or null
	 */
	getLastUnreadTip: function () {
		for (var i=this.tipStore.getTotalCount()-1;i>-1;i--) {
			if (this.tipStore.getAt(i).get("read") === false) {
				return i;
			}
		}
		
		return null;
	},
	/**
	 * Marks the current tip as read. Commits the information to the server.
	 */
	markTipRead: function () {
		this.currentTip.set("read", true);
		this.currentTip.commit();
		
		var call = new PartKeepr.ServiceCall("TipOfTheDay", "markTipAsRead");
		call.setLoadMessage(sprintf(i18n("Marking tip %s as read..."), this.currentTip.get("name")));
		call.setParameter("name", this.currentTip.get("name"));
		call.doCall();
	},
	/**
	 * Displays the next tip
	 */
	displayNextTip: function () {
		this.retrieveTip("ASC");
	},
	/**
	 * Displays the previous tip
	 */
	displayPreviousTip: function () {
		this.retrieveTip("DESC");
	},
	/**
	 * Displays the next or previous tip.
	 * 
	 * @param dir string Either "ASC" or "DESC", which denotes the direction to search for the next tip
	 */
	retrieveTip: function (dir) {
		var startIdx = -1, record = null;
		
		if (this.currentTip) {
			startIdx = this.tipStore.indexOf(this.currentTip);
		}
	
		if (dir === "ASC") {
			record = this.extractNextTip(startIdx);
		} else {
			record = this.extractPreviousTip(startIdx);
		}
		
		if (record) {
			this.currentTip = record;
			this.displayTip(record);	
		}
	},
	/**
	 * Returns the record with the next tip
	 * @param startIdx The index to start searching from
	 * @returns record The record with the next tip
	 */
	extractNextTip: function (startIdx) {
		var record = null, foundRecord = null;
		if (this.displayReadTipsCheckbox.getValue() === true) {
			var tmpIdx = startIdx + 1;
			if (tmpIdx > this.tipStore.getTotalCount() - 1) {
				tmpIdx = this.tipStore.getTotalCount() - 1;
			}
			
			foundRecord = this.tipStore.getAt(tmpIdx);
		} else {
			for (var i = startIdx+1; i < this.tipStore.getTotalCount();i++) {
				record = this.tipStore.getAt(i);
				if (record.get("read") === false) {
					foundRecord = record;
					break;
				}
			}
		}
		
		return foundRecord;
	},
	/**
	 * Returns the record with the previous tip
	 * @param startIdx The index to start searching from
	 * @returns record The record with the previous tip
	 */
	extractPreviousTip: function (startIdx) {
		var record = null, foundRecord = null;
		if (this.displayReadTipsCheckbox.getValue() === true) {
			var tmpIdx = startIdx - 1;
			if (tmpIdx < 0) {
				tmpIdx = 0;
			}
			
			foundRecord = this.tipStore.getAt(tmpIdx);
		} else {
			for (var i = startIdx - 1; i > -1;i--) {
				record = this.tipStore.getAt(i);
				
				if (record.get("read") === false) {
					foundRecord = record;
					break;
				}
			}	
		}
		
		
		return foundRecord;
	}
	
	
});
/**
 * Represents the project report view 
 */
Ext.define('PartKeepr.ProjectReportView', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.ProjectReportView',
	
	bodyStyle: 'background:#DBDBDB;padding: 5px',
	border: false,
	
	defaults: {
	    bodyStyle: 'padding:10px'
	},
	
	layout: 'border',
	
	initComponent: function () {
		
		this.createStores();
		
		this.upperGridEditing = Ext.create('Ext.grid.plugin.CellEditing', {
	        clicksToEdit: 1
	    });
		
		this.reportList = Ext.create("PartKeepr.BaseGrid", {
			selModel: {
				mode: 'MULTI'
			},
			selType: 'checkboxmodel',
			flex: 1,
			columns: [{
				header: i18n("Amount"), dataIndex: 'amount',
				width: 50,
				editor: {
					xtype: 'numberfield'
				}
			},{
				header: i18n("Project Name"), dataIndex: 'name',
				flex: 1
			},{
				header: i18n("Description"), dataIndex: 'description',
				flex: 1
			}],
			store: this.store,
			plugins: [ this.upperGridEditing ]
		});
		
		this.editing = Ext.create('Ext.grid.plugin.CellEditing', {
	        clicksToEdit: 1
	    });
		
		this.reportResult = Ext.create("PartKeepr.BaseGrid", {
			flex: 1,
			features: [{
		        ftype: 'summary'
		    }],
			columns: [{
				header: i18n("Quantity"), dataIndex: 'quantity',
				width: 50
			},{
				header: i18n("Part"),
				renderer: function (val, p, rec) {
					return rec.part().getAt(0).get("name");
				},
				flex: 1
			},{
				header: i18n("Remarks"),
				dataIndex: 'remarks',
				flex: 1
			},{
				header: i18n("Projects"),
				dataIndex: 'projects',
				flex: 1
			},{
				header: i18n("Storage Location"), dataIndex: 'storageLocation_name',
				width: 100
			},{
				header: i18n("Available"), dataIndex: 'available',
				width: 75
			},{
				header: i18n("Distributor"), dataIndex: 'distributor_id',
				renderer: function (val,p,rec) {
					return rec.get("distributor_name");
				},
				flex: 1,
				editor: {
					xtype: 'DistributorComboBox',
					triggerAction: 'query',
					ignoreQuery: true,
					forceSelection: true,
					editable: false
				}
			},{
				header: i18n("Distributor Order Number"), dataIndex: 'distributor_order_number',
				flex: 1,
				editor: {
					xtype: 'textfield'
				}
			},{
				header: i18n("Price per Item"), dataIndex: 'price',
				width: 100
			},{
				header: i18n("Sum"),
				dataIndex: 'sum',
				summaryType: 'sum',
				width: 100
			},{
				header: i18n("Amount to Order"), dataIndex: 'missing',
				width: 100
			},{
				header: i18n("Sum (Order)"),
				dataIndex: 'sum_order',
				summaryType: 'sum',
				width: 100
			}],
			store: this.projectReportStore,
			plugins: [ this.editing ]
		});
		
		this.reportResult.on("beforeedit", this.onBeforeEdit, this);
		this.reportResult.on("edit", this.onEdit, this);
		
		this.createReportButton = Ext.create('Ext.button.Button', {
			xtype: 'button',
			text: i18n("Create Report"),
			width: 120,
			margins: {
				right: 10
			},
			listeners: {
				click: this.onCreateReportClick,
				scope: this
			}
		});
		
		this.autoFillButton = Ext.create('Ext.button.Button', {
		  	  text: i18n("Autofill"),
		  	  width: 120,
		  	  margins: {
		  		  right: 20
		  	  },
		  	  listeners: {
		  		  click: this.onAutoFillClick,
		  		  scope: this
		  		}
		});
		
		this.removeStockButton = Ext.create('Ext.button.Button', {
		  	  text: i18n("Remove parts from stock"),
		  	  width: 160,
		  	  listeners: {
		  		  click: this.onStockRemovalClick,
		  		  scope: this
		  		}
			
		});
		
		this.items = [
		              {
		            	  title: i18n("Choose Projects to create a report for"),
		            	  split: true,
		            	  minHeight: 300,
		            	  height: 300,
		            	  bodyStyle: 'background:#DBDBDB;padding: 10px;',
		            	  layout: {
		            		  type: 'vbox',
		            		  align : 'stretch',
		            		  pack  : 'start'
		            	  },
		            	  region: 'north',
		            	  items: [
									this.reportList,
									{
										layout: {
											type: 'hbox',
											pack: 'start'
										},
										margins: {
											top: 10
										},
										border: false,
										bodyStyle: 'background:#DBDBDB',
										items: [ this.createReportButton , this.autoFillButton, { xtype: 'tbspacer'}, this.removeStockButton ]
									}
		            	          ]
		              },{
		            	  region: 'center',
		            	  layout: 'fit',
		            	  bodyStyle: 'background:#DBDBDB;padding: 10px;',
		            	  title: i18n("Project Report"),
		            	  items: this.reportResult
		              }];
		            	  
		
		
		
		this.callParent();
	},
	/**
	 * Called when the distributor field is about to be edited.
	 * 
	 * Filters the distributor list and show only distributors which are assigned to the particular item.
	 * @param e
	 */
	onBeforeEdit: function (e) {
		if (e.field !== "distributor_id") { return; }
		
		var distributors = e.record.part().getAt(0).distributors();
		
		var filterIds = new Array();
		for (var i=0;i<distributors.count();i++) {
			filterIds.push(distributors.getAt(i).get("distributor_id"));
		}
		
		e.column.getEditor().store.clearFilter();
		e.column.getEditor().store.filter({filterFn: function(item) { 
			for (var i=0;i<filterIds.length;i++) {
				if (item.get("id") == filterIds[i]) {
					return true;
				}
			}
			return false;
		}});
	},
	/**
	 * Removes all parts in the project view.
	 */
	onStockRemovalClick: function () {
		Ext.Msg.confirm(i18n("Remove parts from stock"),
						i18n("Do you really want to remove the parts in the project report from the stock?"),
						this.removeStocks, this);
	},
	removeStocks: function (btn) {
		if (btn == "yes") {
			
			var store = this.reportResult.getStore();
			var removals = [];
			
			for (var i=0;i<store.count();i++) {
				var item = store.getAt(i);
				
				removals.push({
					part: item.part().getAt(0).get("id"),
					amount: item.get("quantity"),
					comment: item.get("projects")
				});
			}
			
			var call = new PartKeepr.ServiceCall(
					"Part", 
					"massDeleteStock");
			
			call.setParameter("removals", removals);
			call.doCall();
		}
	},
	onEdit: function (editor, e) {
		if (e.field == "distributor_id") {
			var distributors = e.record.part().getAt(0).distributors();
			
			for (var i = 0; i < distributors.count(); i++) {
				if (distributors.getAt(i).get("distributor_id") == e.value) {
					e.record.set("distributor_name", distributors.getAt(i).get("distributor_name"));
					e.record.set("price", distributors.getAt(i).get("price"));
					e.record.set("distributor_order_number", distributors.getAt(i).get("orderNumber"));
					
					e.record.set("sum_order", e.record.get("missing") * e.record.get("price"));
					
					e.record.set("sum", e.record.get("quantity") * e.record.get("price"));
				}
			}
		}
		
		this.reportResult.getView().refresh(true);
		
	},
	onAutoFillClick: function () {
		for (var i=0;i<this.reportResult.store.count();i++) {
			var activeRecord = this.reportResult.store.getAt(i);
			var cheapest=null;
			var cheapestPrice=null;
			
			for (var j=0;j<activeRecord.part().getAt(0).distributors().count();j++) {
				var activeDistributor = activeRecord.part().getAt(0).distributors().getAt(j);
				
				if (cheapestPrice === null && parseFloat(activeDistributor.get("price")) !== 0) {
					cheapestPrice = activeDistributor.get("price");
					cheapest = activeDistributor;
				} else {
					if (parseFloat(activeDistributor.get("price")) !== 0 && parseFloat(activeDistributor.get("price")) < cheapestPrice) {
						cheapestPrice = activeDistributor.get("price");
						cheapest = activeDistributor;
					}
				}
				
			}
			
			if (cheapest !== null) {
				activeRecord.set("distributor_name", cheapest.get("distributor_name"));
				activeRecord.set("distributor_order_number", cheapest.get("orderNumber"));
				activeRecord.set("price", cheapest.get("price"));
				activeRecord.set("sum_order", activeRecord.get("missing") * activeRecord.get("price"));
				activeRecord.set("sum", activeRecord.get("quantity") * activeRecord.get("price"));
			}
		}
		
		this.reportResult.getView().refresh(true);
	},
	/**
	 * 
	 */
	onCreateReportClick: function () {
		selection = this.reportList.getSelectionModel().getSelection();
		
		var params = new Array();
		
		for (var i=0;i<selection.length;i++) {
			params.push({ project: selection[i].get("id"), amount: selection[i].get("amount")});
		}
		
		this.projectReportStore.getProxy().extraParams.reports = Ext.encode(params);
		this.projectReportStore.load();
	},
	/**
	 * Creates the store used in this view.
	 */
	createStores: function () {
		var config = {
			autoLoad: true,
			model: "PartKeepr.ProjectReportList",
			pageSize: -1
		};
		
		this.store = Ext.create('Ext.data.Store', config);
		
		this.projectReportStore = Ext.create('Ext.data.Store', {
			model: "PartKeepr.ProjectReport",
			pageSize: -1
		});
	}
});
/**
 * Defines an abstract grid which includes the grid menu plugin. 
 * 
 */
Ext.define('PartKeepr.BaseGrid', {
	extend: 'Ext.grid.Panel',
	alias: 'widget.BaseGrid',

	/**
	 * Initializes the component
	 */
	initComponent: function () {
		
		/**
		 * Check if the plugins already exist (e.g. by a superclass). If yes, assume it is an array, and append
		 * the plugin to it.
		 */
		if (this.plugins) {
			this.plugins.push('gridmenu');
		} else {
			this.plugins = [ 'gridmenu' ];
		}
		
		this.callParent();
	}
});
/**
 * Represents an editable list of project parts.
 */
Ext.define('PartKeepr.ProjectPartGrid', {
	extend: 'PartKeepr.BaseGrid',
	
	/* Column definitions */
	columns: [{
		header: i18n("Quantity"), dataIndex: 'quantity',
		wdith: 50,
		editor: {
            xtype: 'numberfield',
            allowBlank: false,
            minValue: 1
        }
	}, {
		header: i18n("Part"), dataIndex: 'part_id',
		flex: 1,
		editor: {
			xtype: 'RemotePartComboBox'
		},
		renderer: function (val,p,rec) {
			return rec.get("part_name");
		}
	},{
		header: i18n("Remarks"), dataIndex: 'remarks',
		flex: 1,
		editor: {
			xtype: 'textfield'
		}
	}],
	
	/**
	 * Initializes the component
	 */
	initComponent: function () {
		
		this.editing = Ext.create('Ext.grid.plugin.CellEditing', {
	        clicksToEdit: 1
	    });
		
		this.plugins = [ this.editing ];
		
		this.deleteButton = Ext.create("Ext.button.Button", {
            text: i18n('Delete'),
            disabled: true,
            itemId: 'delete',
            scope: this,
            icon: 'resources/silkicons/brick_delete.png',
            handler: this.onDeleteClick
        });
		
		this.viewButton = Ext.create("Ext.button.Button", {
            text: i18n('View Part'),
            disabled: true,
            itemId: 'view',
            scope: this,
            icon: 'resources/silkicons/brick_go.png',
            handler: this.onViewClick
        });
		
		this.dockedItems = [{
		    xtype: 'toolbar',
		    items: [{
		        text: i18n('Add'),
		        scope: this,
		        icon: 'resources/silkicons/brick_add.png',
		        handler: this.onAddClick
		    },{
		    	text: i18n("Create new Part"),
		    	scope: this,
		    	icon: 'resources/silkicons/brick_add.png',
		    	handler: this.onAddPartClick
		    },
		    this.deleteButton,
		    this.viewButton
		    ]
		}];
		
		this.callParent();
		
		this.getSelectionModel().on('selectionchange', this.onSelectChange, this);
	},
	/**
	 * Creates a new row and sets the default quantity to 1.
	 */
	onAddClick: function () {
		this.editing.cancelEdit();
		
		var rec = new PartKeepr.ProjectPart({
			quantity: 1
		});
		
		this.store.insert(this.store.count(), rec);
		
		this.editing.startEdit(rec, this.columns[0]);
	},
	/**
	 * Creates a new part, adds it to the list and sets the default quantity to 1.
	 */
	onAddPartClick: function () {
		var win = Ext.getCmp("partkeepr-partmanager").onItemAdd();
		win.editor.on("editorClose", function (context) {
			// End this if the record is a phatom and thus hasn't been saved yet
			if (context.record.phantom) { return; }
			
			// Insert the new record
			this.editing.cancelEdit();
			
			var rec = new PartKeepr.ProjectPart({
				quantity: 1,
				part_id: context.record.get("id"),
				part_name: context.record.get("name")
			});
			
			this.store.insert(this.store.count(), rec);
			
			this.editing.startEdit(rec, this.columns[0]);
		}, this);
	},
	/**
	 * Removes the currently selected row
	 */
	onDeleteClick: function () {
		var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
            this.store.remove(selection);
        }
	},
	/**
	 * Removes the currently selected row
	 */
	onViewClick: function () {
		var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
            Ext.getCmp("partkeepr-partmanager").onEditPart(selection.get("part_id"));
        }
	},
	/**
	 * Enables or disables the delete button, depending on the row selection
	 */
	onSelectChange: function(selModel, selections){
        this.deleteButton.setDisabled(selections.length === 0);
        this.viewButton.setDisabled(selections.length === 0);
    }
});
/**
 * Represents the stock history grid.
 */
Ext.define('PartKeepr.AbstractStockHistoryGrid', {
	extend: 'PartKeepr.BaseGrid',
	
	pageSize: 25,
	
	defineColumns: function () {
		this.columns = [{
	        	  header: "",
	        	  xtype:'actioncolumn',
	        	  dataIndex: 'direction',
	        	  renderer: function (val) {
	        		  if (val == "out")
	        		  {
	        			  return '<img title="'+i18n("Parts removed")+'" src="resources/silkicons/brick_delete.png"/>';
	        		  } else {
	        			  return '<img title="'+i18n("Parts added")+'" src="resources/silkicons/brick_add.png"/>';
	        		  }
	        	  },
	        	  width: 20
	          },
	          {header: i18n("Date"), dataIndex: 'dateTime', width: 120},
	          {
	        	  header: i18n("User"),
	        	  dataIndex: 'user_id',
	        	  flex: 1,
	        	  minWidth: 80,
	        	  renderer: function (val, p, rec) {
        			  return rec.get("username");
	        	  },
	        	  editor: {
	        		  xtype: 'UserComboBox'
	        	  }
	          },
	          {header: i18n("Amount"),  dataIndex: 'stockLevel', width: 50,
	        	  editor: {
                      xtype:'numberfield',
                      allowBlank:false
                  }},
	          
	          {
	        	  header: i18n("Price"),
	        	  editor: {
                      xtype:'numberfield',
                      allowBlank:false
                  },
	        	  dataIndex: 'price',
	        	  width: 60,
	        	  renderer: function (val, p, rec) {
	        		  if (rec.get("dir") == "out") {
	        			  return "-";
	        		  } else {
	        			  return val;
	        		  }
	        	  }
	          },{
	        	  header: i18n("Comment"),
	        	  dataIndex: 'comment',
	        	  width: 60,
	        	  editor: {
                      xtype:'textfield',
                      allowBlank:true
                  }
	          }];
	},
    model: 'PartKeepr.StockEntry',
    /**
     * Initializes the stock history grid.
     */
    initComponent: function () {
    	
    	this.defineColumns();
    	
    	var config = {
			autoLoad: false,
			autoSync: true, 
			remoteFilter: true,
			remoteSort: true,
			proxy: PartKeepr.getRESTProxy("Stock"),
			model: 'PartKeepr.StockEntry',
 			sorters: [{
	 			property: 'dateTime',
 				direction:'DESC'
 			}],
			pageSize: this.pageSize };
    	
    	this.store = Ext.create('Ext.data.Store', config);
    	
    	this.editing = Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1
        });
		
		this.plugins =  [ this.editing ];
		
		this.bottomToolbar = Ext.create("Ext.toolbar.Paging", {
			store: this.store,
			enableOverflow: true,
			dock: 'bottom',
			displayInfo: false
		});
		
		
		this.dockedItems = new Array();
		this.dockedItems.push(this.bottomToolbar);
		
		this.editing.on("beforeedit", this.onBeforeEdit, this);
		    	
    	this.callParent();
    },
    /**
     * Called before editing a cell. Checks if the user may actually make the requested changes.
     *  
     * @param e Passed from ExtJS
     * @returns {Boolean}
     */
    onBeforeEdit: function (e) {

    	// Checks if the usernames match
    	var sameUser = e.record.get("username") == PartKeepr.getApplication().getUsername();
    	
    	switch (e.field) {
    		case "price":
    			// Check the direction is "out". If yes, editing the price field is not allowed
    			if (e.record.get("direction") == "out") {
    				return false;
    			}
    			
    			// If it's not the same user or an admin, editing is not allowed
    			if ( !sameUser && !PartKeepr.getApplication().isAdmin()) {
    				return false;
    			}
    			break;
    		case "stockLevel":
    			// Only an admin may edit the amount. Regular users must put the stock back in manually.
    			if (!PartKeepr.getApplication().isAdmin()) {
    				return false;
    			}
    			break;
    		case "user":
    			if (!PartKeepr.getApplication().isAdmin()) {
    				return false;
    			}
    			break;
    		case "comment":
    			if ( !sameUser && !PartKeepr.getApplication().isAdmin()) {
    				return false;
    			}
    			break;
		default:
			return true;
    	}

	return true;
    }
});
/**
 * The stock history grid. It shows all stock transactions.
 */
Ext.define('PartKeepr.StockHistoryGrid', {
	extend: 'PartKeepr.AbstractStockHistoryGrid',
	alias: 'widget.PartStockHistory',
	
	pageSize: 25,
	
	defineColumns: function () {
		this.callParent();
		
		this.columns.splice(2, 0, {
	        	  header: i18n("Part"),
	        	  dataIndex: 'part_name',
	        	  flex: 1,
	        	  minWidth: 200
		});
		
		this.columns.splice(3, 0, {
      	  header: i18n("Storage Location"),
      	  dataIndex: 'storageLocation_name',
      	  flex: 1,
      	  minWidth: 200
	});
	},
	initComponent: function () {
		this.callParent();
		
		this.on("activate", this.onActivate, this);
	},
	/**
     * Called when the view is activated.
     */
    onActivate: function () {
		this.store.load();
    }
});

Ext.define('PartKeepr.PartStockHistory', {
	extend: 'PartKeepr.AbstractStockHistoryGrid',
	alias: 'widget.PartStockHistory',
	
	initComponent: function () {
		this.callParent();
		
		this.on("activate", this.onActivate, this);
	},
	/**
     * Called when the view is activated.
     */
    onActivate: function () {
    	var proxy = this.store.getProxy();
		proxy.extraParams.part = this.part;
		
		this.store.load();
    }
});

Ext.define('PartKeepr.MessageLog', {
	extend: 'PartKeepr.BaseGrid',
	store: {
		model: "PartKeepr.Message"
		},
		columns: [
	    	        {header: i18n("Message"),  dataIndex: 'message', flex: 1},
	    	        {header: i18n("Date"), dataIndex: 'date', width: 300},
	    	        {header: i18n("Severity"), dataIndex: 'severity'}
	    	    ],
	    	    proxy: {
	    	        type: 'memory',
	    	        reader: {
	    	            type: 'json',
	    	            root: 'items'
	    	        }
	    	    },
	    	    sorters: [{
	                property: 'date',
	                direction:'DESC'
	            }]
});
Ext.define('PartKeepr.AttachmentGrid', {
	extend: 'PartKeepr.BaseGrid',
	alias: 'widget.AttachmentGrid',
	border: false,
	model: null,
	initComponent: function () {
		if (this.model === null) {
			alert("Error: Model can't be null!");
		}
		
		this.store = Ext.create("Ext.data.Store", {
			model: this.model,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
			
		});
		
		this.editing = Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1
        });
		
		this.plugins =  [ this.editing ];
		
		this.deleteButton = Ext.create("Ext.button.Button", {
                text: i18n('Delete'),
                disabled: true,
                itemId: 'delete',
                scope: this,
                icon: 'resources/silkicons/delete.png',
                handler: this.onDeleteClick
            });
		
		this.viewButton = Ext.create("Ext.button.Button", {
			text: i18n("View"),
			handler: this.onViewClick,
			scope: this,
			icon: 'resources/silkicons/zoom.png',
			disabled: true
		});
		
		this.webcamButton = Ext.create("Ext.button.Button", {
			text: i18n("Take image"),
			handler: this.onWebcamClick,
			scope: this,
			icon: 'resources/fugue-icons/icons/webcam.png'
		});
		
		this.dockedItems = [{
            xtype: 'toolbar',
            items: [{
                text: i18n('Add'),
                scope: this,
                icon: 'resources/silkicons/attach.png',
                handler: this.onAddClick
            },
            this.webcamButton,
            this.viewButton,
            this.deleteButton
            ]
        }];
		
		this.columns = [
		                {
		                	dataIndex: 'extension',
		                	width: 30,
		                	renderer: function (val) {
		                		return '<img src="resources/mimetypes/'+val+'.png"/>';
		                	}
		                },
		                {
		                	header: i18n("Filename"),
		                	dataIndex: 'originalFilename',
		                	width: 200
		                },
		                {
		                	header: i18n("Size"),
		                	dataIndex: 'size',
		                	width: 80,
		                	renderer: PartKeepr.bytesToSize
		                },
		                { 	
		                	header: i18n("Description"),
		                	dataIndex: 'description',
		                	flex: 0.4,
		                	editor: {
		                        xtype:'textfield',
		                        allowBlank:true
		                    }
		                }
		                ];
		
		this.callParent();
		
		this.getSelectionModel().on('selectionchange', this.onSelectChange, this);
		this.on("itemdblclick", this.onDoubleClick, this);
	},
	onWebcamClick: function () {
		var wp = Ext.create("PartKeepr.WebcamPanel");
		wp.on("uploadComplete", this.onFileUploaded, this);
		
		var j = Ext.create("Ext.window.Window", {
			title: i18n("Take Webcam Photo"),
			items: [
			        wp
			        ]
		});
		
		wp.on("uploadComplete", function () { j.close(); });
		
		j.show();
	},
	onDoubleClick: function (view, record) {
		if (record) {
			this.viewAttachment(record);
		}
	},
	onAddClick: function () {
		var j = Ext.create("PartKeepr.FileUploadDialog");
		j.on("fileUploaded", this.onFileUploaded, this);
		j.show();
	},
	onFileUploaded: function (response) {
		this.editing.cancelEdit();
		
		this.store.insert(this.store.getCount(), Ext.create(this.model, {
			id: "TMP:"+response.id,
			extension: response.extension,
			size: response.size,
			originalFilename: response.originalFilename
		}));
		
	},
	onDeleteClick: function () {
		var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
            this.store.remove(selection);
        }
	},
	onSelectChange: function(selModel, selections){
        this.deleteButton.setDisabled(selections.length === 0);
        this.viewButton.setDisabled(selections.length === 0);
    },
    onViewClick: function () {
    	var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
        	this.viewAttachment(selection);
        }
    },
    viewAttachment: function (record) {
    	var mySrc = "file.php?type="+this.model+"&";
    	
    	if (record.get("id") === 0) {
    		mySrc += "id=0&tmpId=" + record.get("tmp_id");
    	} else {
    		mySrc += "id=" + record.get("id");
    	}
    	
    	new Ext.Window({
    	    title : i18n("Display File"),
    	    width : 640,
    	    height: 600,
    	    maximizable: true,
    	    constrain: true,
    	    layout : 'fit',
    	    items : [{
    	        xtype : "component",
    	        autoEl : {
    	            tag : "iframe",
    	            src : mySrc
    	        }
    	    }]
    	}).show();
    }
});
Ext.define('PartKeepr.ProjectAttachmentGrid', {
	extend: 'PartKeepr.AttachmentGrid',
	alias: 'widget.ProjectAttachmentGrid',
	
	model: "PartKeepr.ProjectAttachment"
});
Ext.define('PartKeepr.FootprintAttachmentGrid', {
	extend: 'PartKeepr.AttachmentGrid',
	alias: 'widget.FootprintAttachmentGrid',
	
	model: "PartKeepr.FootprintAttachment"
});
Ext.define('PartKeepr.PartAttachmentGrid', {
	extend: 'PartKeepr.AttachmentGrid',
	alias: 'widget.PartAttachmentGrid',
	
	model: "PartKeepr.PartAttachment"
});
Ext.define('PartKeepr.UserPreferenceGrid', {
	extend: 'PartKeepr.BaseGrid',

	columnLines: true,
	
	columns: [{
       	  	header: i18n("Key"),
       	  	dataIndex: 'key',
       	  	flex: 0.3,
       	  	minWidth: 200,
       	  	renderer: Ext.util.Format.htmlEncode
		},{
			header: i18n("Value"),
			dataIndex: 'value',
			flex: 0.7,
			minWidth: 200,
			renderer: Ext.util.Format.htmlEncode
         }],
    userId: null,
    
	initComponent: function () {
		this.deleteButton = Ext.create("Ext.button.Button", {
            text: i18n('Delete'),
            disabled: true,
            itemId: 'delete',
            scope: this,
            icon: 'resources/silkicons/delete.png',
            handler: this.onDeleteClick
        });
		
		this.dockedItems = [{
            xtype: 'toolbar',
            items: [
            this.deleteButton
            ]
        }];
		this.store = Ext.create("Ext.data.Store", {
			model: 'PartKeepr.UserPreference',
			pageSize: -1
    	});
		
		this.callParent();
		
		this.getSelectionModel().on('selectionchange', this.onSelectChange, this);
	},
	onDeleteClick: function () {
		var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
        	// Set phantom to false because ExtJS has problems with PK-less thingies
        	selection.phantom = false;
            this.store.remove(selection);
        }
	},
	onSelectChange: function(selModel, selections){
        this.deleteButton.setDisabled(selections.length === 0);
    },
    syncPreferences: function () {
    	/* Iterate through all removed records and issue an AJAX
    	 * call. This is necessary because the server side doesn't suport string
    	 * keys and ExtJS can't handle composite keys.
    	 */
    	for (var j=0;j<this.store.removed.length;j++) {
    		var call = new PartKeepr.ServiceCall("UserPreference", "destroy");
			call.setParameter("key", this.store.removed[j].get("key"));
			call.setParameter("user_id", this.store.removed[j].get("user_id"));
			call.doCall();
    	}
    	
    	this.store.removed = [];
    }
});

/**
 * This class represents a list of all system information records.
 */
Ext.define('PartKeepr.SystemInformationGrid', {
	extend: 'PartKeepr.BaseGrid',
	
	/* Define the columns */
	columns: [
	          {
	        	  header: 'Name',
	        	  dataIndex: 'name',
	        	  width: 200
	          },{
	        	  header: 'Value',
	        	  dataIndex: 'value',
	        	  renderer: 'htmlEncode',
	        	  flex:1
	          },{
	        	  header: 'Category',
	        	  dataIndex: 'category',
	        	  hidden: true
	          }
	          ],
	
	/**
	 * Initializes the component
	 */
	initComponent: function () {
		
		/* Add grouping */
		var groupingFeature = Ext.create('Ext.grid.feature.Grouping',{
	        groupHeaderTpl: '{name}'
	    });
		
		this.features = [groupingFeature];
		
		/* Create the store using an in-memory proxy */
		this.store = Ext.create("Ext.data.Store", {
			model: 'PartKeepr.SystemInformationRecord',
			sorters: ['category','name'],
			groupField: 'category',
			proxy: {
		        type: 'memory'
		    }
		});
		

		/* Add the refresh button */
		this.refreshButton = Ext.create("Ext.button.Button", {
			handler: this.requestSystemInformation,
			scope: this,
			text: i18n("Refresh")
		});
		
		this.bottomToolbar = Ext.create("Ext.toolbar.Toolbar", {
			dock: 'bottom',
			ui: 'footer',
			items: [ this.refreshButton ]
		});
		
		this.dockedItems = [ this.bottomToolbar ];
		
		// Initialize the panel
		this.callParent();
		
		// Retrieve the system information 
		this.requestSystemInformation();
		
	},
	/**
	 * Requests the system information from the server.
	 */
	requestSystemInformation: function () {
		var call = new PartKeepr.ServiceCall("System", "getSystemInformation");
		call.setHandler(Ext.bind(this.processSystemInformationRecords, this));
		call.doCall();
	},
	/**
	 * Processes the response given by the getSystemInformation call.
	 * 
	 * Removes all records from the store and re-creates the records.
	 * 
	 * @param response The response record
	 */
	processSystemInformationRecords: function (response) {
		this.store.removeAll();
		
		// Workaround for removeAll Bug - see http://www.sencha.com/forum/showthread.php?136673-4.0.2-store.removeAll()-does-not-perform-view.all.clear()
		this.view.all.clear();
		
		for (var i=0;i<response.data.length;i++) {
			var rec = new PartKeepr.SystemInformationRecord({
				category: response.data[i].category,
				name: response.data[i].name,
				value: response.data[i].value
			});
			
			this.store.insert(0, rec);
			
		}
	}
});
/**
 * This class extends a regular GridPanel with the following features:
 * 
 * - Buttons to add/delete items
 * - Enable/Disable the delete button if an item is selected
 * - Search field
 * - Paging Toolbar
 */
Ext.define('PartKeepr.EditorGrid', {
	extend: 'PartKeepr.BaseGrid',
	alias: 'widget.EditorGrid',
	
	/**
     * @cfg {String} text The text for the "delete" button
     */
	deleteButtonText: i18n("Delete Item"),
	
	/**
     * @cfg {String} text The path to the 'delete' icon
     */
	deleteButtonIcon: 'resources/silkicons/delete.png',
	
	/**
     * @cfg {String} text The text for the "add" button
     */
	addButtonText: i18n("Add Item"),
	
	/**
     * @cfg {String} text The path to the 'add' icon
     */
	addButtonIcon: 'resources/silkicons/add.png',
	
	/**
     * @cfg {Boolean} boolean Specifies whether to enable the top toolbar or not
     */
	enableTopToolbar: true,
	
	/**
     * @cfg {String} text Defines if the "add"/"delete" buttons should show their text or icon only. If "hide", the
     * button text is hidden, anything else shows the text.
     */
	buttonTextMode: 'hide',
	
	initComponent: function () {
		
		this.addEvents(
				/**
	             * @event itemSelect
	             * Fires if a record was selected within the grid.
	             * @param {Object} record The selected record
	             */
				"itemSelect",
				
				/**
	             * @event itemDeselect
	             * Fires if a record was deselected within the grid.
	             * @param {Object} record The deselected record
	             */
				"itemDeselect",

				/**
				 * @event itemEdit
				 * Fires if a record should be edited.
				 * @param {Object} record The record to edit
				 */
				"itemEdit",
				
				/**
	             * @event itemDelete
	             * Fires if the delete button was clicked.
	             */
				"itemDelete",
				
				/**
	             * @event itemDelete
	             * Fires if the add button was clicked.
	             */
				"itemAdd");
		
		
		this.getSelectionModel().on("select", 	this._onItemSelect, 	this);
		this.getSelectionModel().on("deselect", this._onItemDeselect, 	this);
		
		this.on("itemclick", this._onItemEdit, this);

		this.deleteButton = Ext.create("Ext.button.Button", {
			text: (this.buttonTextMode !== "hide") ? this.deleteButtonText : '',
			tooltip: this.deleteButtonText,
			icon: this.deleteButtonIcon,
        	handler: Ext.bind(function () {
        		this.fireEvent("itemDelete");
        	}, this),
        	disabled: true
		});
		
		this.addButton = Ext.create("Ext.button.Button", {
			text: (this.buttonTextMode !== "hide") ? this.addButtonText : '',
        	tooltip: this.addButtonText,
        	icon: this.addButtonIcon,
        	handler: Ext.bind(function () {
        		this.fireEvent("itemAdd");
        	}, this)
		});
		
		this.searchField = Ext.create("Ext.ux.form.SearchField",{
				store: this.store
			});
		
		this.topToolbar = Ext.create("Ext.toolbar.Toolbar",{
			dock: 'top',
			enableOverflow: true,
			items: [
			        this.addButton,
			        this.deleteButton,
			        { xtype: 'tbfill' },
			        this.searchField]
		});
		
		this.bottomToolbar = Ext.create("Ext.toolbar.Paging", {
			store: this.store,
			enableOverflow: true,
			dock: 'bottom',
			displayInfo: false
		});
		
		this.dockedItems = new Array();
		
		this.dockedItems.push(this.bottomToolbar);
	
		if (this.enableTopToolbar) {
			this.dockedItems.push(this.topToolbar);	
		}
		
		this.plugins = [ 'gridmenu' ];
		
		this.callParent();
	},
	syncChanges: function (record) {
		// Simply reload the store for now
		this.store.load();
	},
	/**
	 * Called when an item was selected. Enables/disables the delete button. 
	 */
	_updateDeleteButton: function (selectionModel, record) {
		/* Right now, we support delete on a single record only */
		if (this.getSelectionModel().getCount() == 1) {
			this.deleteButton.enable();
		} else {
			this.deleteButton.disable();
		}
	},
	
	/**
	 * Called when an item should be edited
	 */
	_onItemEdit: function (view, record) {
		this.fireEvent("itemEdit", record.get("id"));
	},
	/**
	 * Called when an item was selected
	 */
	_onItemSelect: function (selectionModel, record) {
		this._updateDeleteButton(selectionModel, record);
		this.fireEvent("itemSelect", record);
	},
	/**
	 * Called when an item was deselected
	 */
	_onItemDeselect: function (selectionModel, record) {
		this._updateDeleteButton(selectionModel, record);
		this.fireEvent("itemDeselect", record);
	}
});
/**
 * Represents the project grid
 */
Ext.define('PartKeepr.SystemNoticeGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.SystemNoticeGrid',
	columns: [
	          {header: i18n("Name"),  dataIndex: 'title', flex: 1}
	          ],
	enableTopToolbar: false
});
/**
 * Represents the project grid
 */
Ext.define('PartKeepr.ProjectGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.ProjectGrid',
	columns: [
	          {header: i18n("Project"),  dataIndex: 'name', flex: 1}
	          ],
	addButtonText: i18n("Add Project"),
	addButtonIcon: 'resources/fugue-icons/icons/drill--plus.png',
    deleteButtonText: i18n("Delete Project"),
    deleteButtonIcon: 'resources/fugue-icons/icons/drill--minus.png'
});
Ext.define('PartKeepr.ManufacturerGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.ManufacturerGrid',
	columns: [
	          {header: i18n("Manufacturer"),  dataIndex: 'name', flex: 1}
	          ],
	addButtonText: i18n("Add Manufacturer"),
	addButtonIcon: 'resources/silkicons/building_add.png',
    deleteButtonText: i18n("Delete Manufacturer"),
    deleteButtonIcon: 'resources/silkicons/building_delete.png'
});
Ext.define('PartKeepr.UserGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.UserGrid',
	columns: [
	          {header: i18n("User"),  dataIndex: 'username', flex: 1}
	          ],
	addButtonText: i18n("Add User"),
	addButtonIcon: 'resources/silkicons/user_add.png',
    deleteButtonText: i18n("Delete User"),
    deleteButtonIcon: 'resources/silkicons/user_delete.png'
});
Ext.define('PartKeepr.PartUnitGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.PartUnitGrid',
	columns: [
	          {header: i18n("Part Measurement Unit"),  dataIndex: 'name', flex: 1},
	          {header: i18n("Default"),  dataIndex: 'default', width: 60, renderer: function (val) { if (val === true) { return "✓"; } else { return ""; }}}
	          ],
	addButtonText: i18n("Add Part Measurement Unit"),
	addButtonIcon: "resources/fugue-icons/icons/ruler--plus.png",
    deleteButtonText: i18n("Delete Part Measurement Unit"),
    deleteButtonIcon: "resources/fugue-icons/icons/ruler--minus.png",
    defaultButtonIcon: "resources/fugue-icons/icons/ruler--pencil.png",
    initComponent: function () {
    	this.callParent();
    	
    	this.defaultButton = Ext.create("Ext.button.Button", {
    		icon: this.defaultButtonIcon,
    		tooltip: i18n('Mark Part Measurement Unit as Default'),
    		disabled: true,
    		handler: this.onDefaultClick,
    		scope: this
    	});
    	
    	this.getSelectionModel().on("deselect", 
				Ext.bind(function (rsm, r, i) {
						this.defaultButton.disable();
				}, this));
    	
    	this.getSelectionModel().on("select", 
				Ext.bind(function (rsm, r, i) {
					this.defaultButton.enable();
				}, this));
    	this.topToolbar.insert(2, {xtype: 'tbseparator'});
    	this.topToolbar.insert(3, this.defaultButton);
    },
    onDefaultClick: function () {
    	var r = this.getSelectionModel().getLastSelected();
    	
    	var call = new PartKeepr.ServiceCall(
    			"PartUnit", 
    			"setDefault");
    	
    	call.setParameter("id", r.get("id"));
    	
    	call.setHandler(Ext.bind(this.onDefaultHandler, this));
		call.doCall();
    },
    onDefaultHandler: function () {
    	this.store.load();
    }
});
Ext.define('PartKeepr.UnitGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.UnitGrid',
	columns: [
	          {header: i18n("Unit"),  dataIndex: 'name', flex: 1},
	          {header: i18n("Symbol"),  dataIndex: 'symbol', width: 60}
	          ],
	addButtonText: i18n("Add Unit"),
	addButtonIcon: 'resources/icons/unit_add.png',
    deleteButtonText: i18n("Delete Unit"),
    deleteButtonIcon: 'resources/icons/unit_delete.png',
    initComponent: function () {
    	this.callParent();
    }
});
Ext.define('PartKeepr.DistributorGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.DistributorGrid',
	columns: [
	          {header: i18n("Distributor"),  dataIndex: 'name', flex: 1}
	          ],
	addButtonText: i18n("Add Distributor"),
	addButtonIcon: 'resources/silkicons/lorry_add.png',
    deleteButtonText: i18n("Delete Distributor"),
    deleteButtonIcon: 'resources/silkicons/lorry_delete.png'
    
});
Ext.define('PartKeepr.StorageLocationGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.StorageLocationGrid',
	columns: [
	          {header: i18n("Storage Location"),  dataIndex: 'name', flex: 1}
	          ],
	addButtonText: i18n("Add Storage Location"),
	addButtonIcon: 'resources/fugue-icons/icons/wooden-box--plus.png',
    deleteButtonText: i18n("Delete Storage Location"),
    deleteButtonIcon: 'resources/fugue-icons/icons/wooden-box--minus.png',
    initComponent: function () {
    	this.callParent();
    	
    	// Adds a button which shows the multi-create window
    	this.multiCreateButton = Ext.create("Ext.button.Button", {
    		icon: 'resources/icons/storagelocation_multiadd.png',
    		tooltip: i18n("Multi-create storage locations"),
    		handler: this.onMultiCreateClick,
    		scope: this
    	});
    	
    	this.topToolbar.insert(2, {xtype: 'tbseparator'});
    	this.topToolbar.insert(3, this.multiCreateButton);
    },
    /**
     * Creates a new storage location multi-create window.
     */
    onMultiCreateClick: function () {
    	var j = Ext.create("PartKeepr.StorageLocationMultiCreateWindow", {
    		listeners: {
    			destroy: {
    				fn: this.onMultiCreateWindowDestroy,
    				scope: this
    			}
    		}
    	});
    	j.show();
    },
    /**
     * Reloads the store after the multi-create window was closed
     */
    onMultiCreateWindowDestroy: function () {
    	this.store.load();
    }
});
/**
 * This class is the main part list grid.
 * 
 */
Ext.define('PartKeepr.PartsGrid', {
	extend: 'PartKeepr.EditorGrid',
	alias: 'widget.PartsGrid',
	
	// We want to display the texts for the add/delete buttons
	buttonTextMode: 'show',
	
	addButtonText: i18n("Add Part"),
	addButtonIcon: 'resources/silkicons/brick_add.png',
    deleteButtonText: i18n("Delete Part"),
    deleteButtonIcon: 'resources/silkicons/brick_delete.png',
    
    expandRowButtonIcon: 'resources/icons/group-expand.png',
    collapseRowButtonIcon: 'resources/icons/group-collapse.png',
    
	viewConfig: {
        plugins: {
            ddGroup: 'CategoryTree',
            ptype: 'gridviewdragdrop',
            enableDrop: false
        }
    },
    enableDragDrop   : true,
    stripeRows       : true,
    multiSelect		 : true,
    autoScroll: false,
    invalidateScrollerOnRefresh: true,
	initComponent: function () {
		
		this.groupingFeature = Ext.create('Ext.grid.feature.Grouping',{
			//enableGroupingMenu: false,
	        groupHeaderTpl: '{name} ({rows.length} ' + i18n("Part(s)")+")"
	    });

		// Create the columns
		this.defineColumns();
		
		
		this.features = [this.groupingFeature];
		
		this.on("itemdblclick", this.onDoubleClick, this);
		
		this.addEvents("editPart");
		
		// Bugfix for scroller becoming detached.
		// @todo Remove with ExtJS 4.1
		this.on('scrollershow', function(scroller) {
			  if (scroller && scroller.scrollEl) {
			    scroller.clearManagedListeners(); 
			    scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
			  }
			});
		
		this.editing = Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1
        });
		
		this.editing.on("edit", this.onEdit, this);
		
		// Initialize the panel
		this.callParent();
		
		this.bottomToolbar.add({
			xtype: 'button',
			tooltip: i18n("Expand all Groups"),
			icon: this.expandRowButtonIcon,
			listeners: {
				scope: this.groupingFeature,
				click: this.groupingFeature.expandAll	
			}
			
		});
		
		this.bottomToolbar.add({
			xtype: 'button',
			tooltip: i18n("Collapse all Groups"),
			icon: this.collapseRowButtonIcon,
			listeners: {
				scope: this.groupingFeature,
				click: this.groupingFeature.collapseAll	
			}
		});
		

		this.addFromTemplateButton = Ext.create("Ext.button.Button", {
			disabled: true,
			handler: Ext.bind(function () {
        		this.fireEvent("itemCreateFromTemplate");
        	}, this),
			tooltip: i18n("Add a new part, using the selected part as template"),
			text: i18n("Create from Template"),
			icon: 'resources/silkicons/brick_link.png'
		});
		
		this.topToolbar.insert(2, this.addFromTemplateButton);
		
	},
	/**
	 * Called when an item was selected. Enables/disables the delete button. 
	 */
	_updateAddTemplateButton: function (selectionModel, record) {
		/* Right now, we support delete on a single record only */
		if (this.getSelectionModel().getCount() == 1) {
			this.addFromTemplateButton.enable();
		} else {
			this.addFromTemplateButton.disable();
		}
	},
	/**
	 * Called when an item was selected
	 */
	_onItemSelect: function (selectionModel, record) {
		this._updateAddTemplateButton(selectionModel, record);
		this.callParent(arguments);
	},
	/**
	 * Called when an item was deselected
	 */
	_onItemDeselect: function (selectionModel, record) {
		this._updateAddTemplateButton(selectionModel, record);
		this.callParent(arguments);
	},
	/**
	 * Called when the record was double-clicked
	 */
	onDoubleClick: function (view, record) {
		if (record) {
			this.fireEvent("editPart", record.get("id"));
		}
	},
	/**
	 * Defines the columns used in this grid.
	 */
	defineColumns: function () {
		this.columns = [
		          {
		        	  header: "",
		        	  dataIndex: "",
		        	  width: 30,
		        	  renderer: this.iconRenderer
		          },
		          {
		        	  header: i18n("Name"),
		        	  dataIndex: 'name',
		        	  flex: 1,
		        	  minWidth: 200,
		        	  renderer: Ext.util.Format.htmlEncode
		          },{
		        	  header: i18n("Storage Location"),
		        	  dataIndex: 'storageLocationName'
		          },{
		        	  header: i18n("Status"),
		        	  dataIndex: "status"
		          },{
		        	  header: i18n("Stock"),
		        	  dataIndex: 'stockLevel',
		        	  editor: {
	                      xtype:'numberfield',
	                      allowBlank:false
	                  },
		        	  renderer: this.stockLevelRenderer
		          },{
		        	  header: i18n("Min. Stock"),
		        	  dataIndex: 'minStockLevel',
		        	  renderer: this.stockLevelRenderer
		          },{
		        	  header: i18n("Avg. Price"),
		        	  dataIndex: 'averagePrice'
		          },{
		        	  header: i18n("Footprint"),
		        	  dataIndex: 'footprintName'
		          },{
		        	  header: i18n("Category"),
		        	  dataIndex: 'categoryPath',
		        	  hidden: true
		          },{
		        	  header: i18n("Create Date"),
		        	  dataIndex: 'createDate',
		        	  hidden: true
		          }
		          
		          ];
	},
	/**
	 * Used as renderer for the stock level columns.
	 * 
	 * If a part contains a non-default unit, we display it.
	 * Otherwise we hide it.
	 */
	stockLevelRenderer: function (val,q,rec)
	{
		if (rec.get("partUnitDefault") !== true) {
			return val + " " + rec.get("partUnitName");
		} else {
			return val;
		}
	},
	/**
	 * Used as renderer for the icon column.
	 */
	iconRenderer: function (val,q,rec)
	{
		var ret = "";
		if (rec.get("attachmentCount") > 0) {
			ret += '<img src="resources/diagona-icons/icons/10/190.png" style="margin-top: 2px;" alt="'+i18n("Has attachments")+'" title="'+i18n("Has attachments")+'"/>';
		}
		
		return ret;
	},
	/**
	 * Sets the category. Triggers a store reload with a category filter.
	 */
	setCategory: function (category) {
		this.currentCategory = category;
		
		var proxy = this.store.getProxy();
		
		proxy.extraParams.category = category;
		this.searchField.onTrigger1Click();
		
		this.store.currentPage = 1;
		this.store.load({ start: 0});
	},
	/**
	 * Handles editing of the grid fields. Right now, only the stock level editing is supported.
	 * 
	 * @param e An edit event, as documented in
	 * 		    http://docs.sencha.com/ext-js/4-0/#!/api/Ext.grid.plugin.CellEditing-event-edit
	 */
	onEdit: function (editor, e) {
		switch (e.field) {
			case "stockLevel": this.handleStockFieldEdit(e); break;
			default: break;
		}
	},
	/**
	 * Handles the editing of the stock level field. Checks if the user has opted in to skip the
	 * online stock edit confirm window, and runs the changes afterwards.
	 * 
	 * @param e An edit event, as documented in
	 * 		    http://docs.sencha.com/ext-js/4-0/#!/api/Ext.grid.plugin.CellEditing-event-edit
	 */
	handleStockFieldEdit: function (e) {
		if (PartKeepr.getApplication().getUserPreference("partkeepr.inline-stock-change.confirm") === false) {
			this.handleStockChange(e);
		} else {
			this.confirmStockChange(e);
		}
	},
	/**
	 * Opens the confirm dialog
	 * 
	 * @param e An edit event, as documented in
	 * 		    http://docs.sencha.com/ext-js/4-0/#!/api/Ext.grid.plugin.CellEditing-event-edit
	 */
	confirmStockChange: function (e) {
		var confirmText = "";
		var headerText = "";
		
		if (e.value < 0) {
			confirmText = sprintf(	i18n("You wish to remove <b>%s %s</b> of the part <b>%s</b>. Is this correct?"),
									abs(e.value), e.record.get("partUnitName"), e.record.get("name"));
			
			// Set the stock level to a temporary calculated value. 
			e.record.set("stockLevel", (e.originalValue - abs(e.value)));
			headerText = i18n("Remove Part(s)");
		} else {
			confirmText = sprintf(
							i18n("You wish to set the stock level to <b>%s %s</b> of part <b>%s</b>. Is this correct?"),
							abs(e.value), e.record.get("partUnitName"), e.record.get("name"));
			
			headerText = i18n("Set Stock Level for Part(s)");
		}
		
		var j = new PartKeepr.RememberChoiceMessageBox({
			escButtonAction: "cancel",
			dontAskAgainProperty: "partkeepr.inlinestockremoval.ask",
			dontAskAgainValue: false
		});
		
		j.show({
                title : headerText,
                msg : confirmText,
                buttons: Ext.Msg.OKCANCEL,
                fn: this.afterConfirmStockChange,
                scope : this,
                originalOnEdit: e,
                dialog: j
            });
	},
	/**
	 * Callback for the stock removal confirm window. 
	 *
	 * The parameters are documented on:
	 * http://docs.sencha.com/ext-js/4-0/#!/api/Ext.window.MessageBox-method-show 
	 */
	afterConfirmStockChange: function (buttonId, text, opts) {
		if (buttonId == "cancel") {
			opts.originalOnEdit.record.set("stockLevel", opts.originalOnEdit.originalValue);
		}
		
		if (buttonId == "ok") {
			if (opts.dialog.rememberChoiceCheckbox.getValue() === true) {
				PartKeepr.getApplication().setUserPreference("partkeepr.inline-stock-change.confirm", false);
			}
			
			this.handleStockChange(opts.originalOnEdit);
		}
	},
	/**
	 * Handles the stock change. Automatically figures out which method to call (deleteStock or addStock) and
	 * sets the correct quantity.
	 * 
	 * @param e An edit event, as documented in
	 * 		    http://docs.sencha.com/ext-js/4-0/#!/api/Ext.grid.plugin.CellEditing-event-edit
	 */
	handleStockChange: function (e) {
		var mode, quantity = 0;
		
		if (e.value < 0) {
			mode = "deleteStock";
			quantity = abs(e.value);
		} else {
			if (e.originalValue <= e.value) {
				mode = "deleteStock";
				quantity = e.originalValue - e.value;
			} else {
				mode = "addStock";
				quantity = e.value - e.originalValue;
			}
		}
		
		var call = new PartKeepr.ServiceCall(
    			"Part", 
    			mode);
		call.setParameter("stock", quantity);
		call.setParameter("part", e.record.get("id"));
    	call.setHandler(Ext.bind(this.reloadPart, this, [ e ]));
    	call.doCall();
	},
	/**
	 * Reloads the current part
	 */
	reloadPart: function (opts) {
		this.loadPart(opts.record.get("id"), opts);
	},
	/**
	 * Load the part from the database.
	 */
	loadPart: function (id, opts) {
		PartKeepr.Part.load(id, {
			scope: this,
		    success: this.onPartLoaded
		});
	},
	/**
	 * Callback after the part is loaded
	 */
	onPartLoaded: function (record, opts) {
		var rec = this.store.findRecord("id", record.get("id"));
		if (rec) {
			rec.set("stockLevel", record.get("stockLevel"));
		}
	}
});
Ext.define('PartKeepr.PartParameterGrid', {
	extend: 'PartKeepr.BaseGrid',
	alias: 'widget.PartParameterGrid',
	border: false,
	initComponent: function () {
		this.store = Ext.create("Ext.data.Store", {
			model: 'PartKeepr.PartParameter',
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}			
		});
		
		this.editing = Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1,
            listeners: {
            	scope: this,
            	beforeedit: this.onBeforeEdit,
            	edit: this.onAfterEdit
            }
        });
		
		this.plugins =  [ this.editing ];
		
		this.deleteButton = Ext.create("Ext.button.Button", {
                text: i18n('Delete'),
                disabled: true,
                itemId: 'delete',
                scope: this,
                icon: 'resources/fugue-icons/icons/table--minus.png',
                handler: this.onDeleteClick
            });
		
		this.dockedItems = [{
            xtype: 'toolbar',
            items: [{
                text: i18n('Add'),
                scope: this,
                icon: 'resources/fugue-icons/icons/table--plus.png',
                handler: this.onAddClick
            }, this.deleteButton]
        }];
		
		this.columns = [
		                {
		                	header: i18n("Parameter"),
		                	dataIndex: 'name',
		                	flex: 0.2,
		                	editor: {
		                        xtype:'PartParameterComboBox',
		                        allowBlank:false,
		                        lazyRender: true,
		                        listClass: 'x-combo-list-small',
		                        selectOnTab: true
		                    }
		                },
		                {
		                	header: i18n("Value"),
		                	flex: 0.2,
		                	dataIndex: "prefixedValue",
		                	renderer: function (val,p,rec) {
		                		if (!Ext.isObject(val)) { return ""; }
		                		
		                		var foundRec = PartKeepr.getApplication().getUnitStore().findRecord("id", rec.get("unit_id"));
		                		
		                		if (foundRec) {
		                			return val.value + " "+val.symbol + foundRec.get("symbol");
		                		} else {
		                			return val.value + " "+val.symbol;
		                		}
		                		
		                	},
		                	editor: {
		                		xtype: 'SiUnitField',
		                		decimalPrecision: 20
		                	}
		                },
		                {
		                	header: i18n("Unit"),
		                	flex: 0.2,
		                	dataIndex: 'unit_id',
		                	renderer: function (val,p,rec) {
		                		var foundRec = PartKeepr.getApplication().getUnitStore().findRecord("id", val);
		                		
		                		if (foundRec) {
		                			return foundRec.get("name");
		                		} else {
		                			return "";
		                		}
		                	},
		                	editor: {
		                        xtype:'UnitComboBox',
		                        allowBlank:true
		                    }
		                },
		                { 	
		                	header: i18n("Description"),
		                	dataIndex: 'description',
		                	flex: 0.3,
		                	editor: {
		                        xtype:'textfield',
		                        allowBlank:true
		                    }
		                }
		                ];
		
		this.callParent();
		
		this.getSelectionModel().on('selectionchange', this.onSelectChange, this);
	},
	onAddClick: function () {
		this.editing.cancelEdit();
		
		var rec = new PartKeepr.PartParameter({
			
		});
		
		this.store.insert(0, rec);
		
		this.editing.startEditByPosition({ row: 0, column: 0});
	},
	onDeleteClick: function () {
		var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
            this.store.remove(selection);
        }
	},
	onSelectChange: function(selModel, selections){
        this.deleteButton.setDisabled(selections.length === 0);
    },
    onBeforeEdit: function (editor, e, o) {
    	var header = this.headerCt.getHeaderAtIndex(editor.colIdx);
    	var edit = this.editing.getEditor(editor.record, header);
    	
    	if (editor.field == "prefixedValue") {
    		var unit = PartKeepr.getApplication().getUnitStore().getById(editor.record.get("unit_id"));
    		if (unit) {
    			edit.field.setStore(unit.prefixes());
    		}
    	}
    },
    onAfterEdit: function (editor, e) {
    	var f = e.record.get("prefixedValue");
    	e.record.set("siprefix_id", f.siprefix_id);
    	e.record.set("value", f.value);
    }
});
Ext.define('PartKeepr.PartManufacturerGrid', {
	extend: 'PartKeepr.BaseGrid',
	alias: 'widget.PartManufacturerGrid',
	border: false,
	initComponent: function () {
		this.store = Ext.create("Ext.data.Store", {
			model: 'PartKeepr.PartManufacturer',
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
			
		});
		
		this.editing = Ext.create('Ext.grid.plugin.RowEditing', {
            clicksToEdit: 1
        });
		
		this.plugins =  [ this.editing ];
		
		this.deleteButton = Ext.create("Ext.button.Button", {
                text: 'Delete',
                disabled: true,
                itemId: 'delete',
                scope: this,
                icon: 'resources/silkicons/building_delete.png',
                handler: this.onDeleteClick
            });
		
		this.dockedItems = [{
            xtype: 'toolbar',
            items: [{
                text: 'Add',
                scope: this,
                icon: 'resources/silkicons/building_add.png',
                handler: this.onAddClick
            }, this.deleteButton]
        }];
		
		this.columns = [
		                {
		                	header: i18n("Manufacturer"),
		                	dataIndex: 'manufacturer_id',
		                	xtype: 'templatecolumn',
		                	tpl: '{manufacturer_name}',
		                	flex: 0.4,
		                	editor: {
		                        xtype:'ManufacturerComboBox',
		                        allowBlank:true
		                    }
		                },
		                { 	
		                	header: i18n("Part Number"),
		                	dataIndex: 'partNumber',
		                	flex: 0.4,
		                	editor: {
		                        xtype:'textfield',
		                        allowBlank:true
		                    }
		                }
		                ];
		
		this.callParent();
		
		this.getSelectionModel().on('selectionchange', this.onSelectChange, this);
		this.on("edit", this.onEdit, this);
	},
	onEdit: function (data) {
		var id = data.record.get("manufacturer_id");
		
		var rec = PartKeepr.getApplication().getManufacturerStore().findRecord("id", id);
		
		if (rec) {
			data.record.set("manufacturer_name", rec.get("name"));
		}
	},
	onAddClick: function () {
		this.editing.cancelEdit();
		
		var rec = new PartKeepr.PartManufacturer({
			packagingUnit: 1
		});
		
		this.store.insert(0, rec);
		
		this.editing.startEdit(0,0);
	},
	onDeleteClick: function () {
		var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
            this.store.remove(selection);
        }
	},
	onSelectChange: function(selModel, selections){
        this.deleteButton.setDisabled(selections.length === 0);
    }
});
Ext.define('PartKeepr.PartDistributorGrid', {
	extend: 'PartKeepr.BaseGrid',
	alias: 'widget.PartDistributorGrid',
	border: false,
	initComponent: function () {
		this.store = Ext.create("Ext.data.Store", {
			model: 'PartKeepr.PartDistributor',
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
			
		});
		
		this.editing = Ext.create('Ext.grid.plugin.RowEditing', {
            clicksToEdit: 1
        });
		
		this.plugins =  [ this.editing ];
		
		this.deleteButton = Ext.create("Ext.button.Button", {
                text: 'Delete',
                disabled: true,
                itemId: 'delete',
                scope: this,
                icon: 'resources/silkicons/lorry_delete.png',
                handler: this.onDeleteClick
            });
		
		this.dockedItems = [{
            xtype: 'toolbar',
            items: [{
                text: 'Add',
                scope: this,
                icon: 'resources/silkicons/lorry_add.png',
                handler: this.onAddClick
            }, this.deleteButton]
        }];
		
		this.columns = [
		                {
		                	header: i18n("Distributor"),
		                	dataIndex: 'distributor_id',
		                	xtype: 'templatecolumn',
		                	tpl: '{distributor_name}',
		                	flex: 0.3,
		                	editor: {
		                        xtype:'DistributorComboBox',
		                        allowBlank:true
		                    }
		                },
		                { 	
		                	header: i18n("Order Number"),
		                	dataIndex: 'orderNumber',
		                	flex: 0.3,
		                	editor: {
		                        xtype:'textfield',
		                        allowBlank:true
		                    }
		                },{
		                	header: i18n("Packaging Unit"),
		                	dataIndex: 'packagingUnit',
		                	flex: 0.2,
		                	editor: {
		                        xtype:'numberfield',
		                        allowDecimals: false,
		                        allowBlank:false,
		                        minValue: 1
		                    }
		                },{
		                	header: i18n("Price per Item"),
		                	dataIndex: 'price',
		                	flex: 0.2,
		                	editor: {
		                		xtype:'numberfield',
		                        allowDecimals: true,
		                        allowBlank:true
		                	}
		                }
		                ];
		
		this.callParent();
		
		this.getSelectionModel().on('selectionchange', this.onSelectChange, this);
		this.on("edit", this.onEdit, this);
	},
	onEdit: function (data) {
		var id = data.record.get("distributor_id");
		
		var rec = PartKeepr.getApplication().getDistributorStore().findRecord("id", id);
		
		if (rec) {
			data.record.set("distributor_name", rec.get("name"));
		}
	},
	onAddClick: function () {
		this.editing.cancelEdit();
		
		var rec = new PartKeepr.PartDistributor({
			packagingUnit: 1
		});
		
		this.store.insert(0, rec);
		
		this.editing.startEdit(0,0);
	},
	onDeleteClick: function () {
		var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
            this.store.remove(selection);
        }
	},
	onSelectChange: function(selModel, selections){
        this.deleteButton.setDisabled(selections.length === 0);
    }
});
/**
 * Defines a grid menu plugin which appears when a grid is right-clicked.
 * 
 * Currently only contains an export menu.
 */
Ext.define("PartKeepr.GridMenuPlugin", {
	alias: 'plugin.gridmenu',
	
	// Private: The assigned grid
	grid: null,
	
	/**
	 * Initializes the plugin.
	 * @param grid {Object} The grid to which this plugin is bound
	 */
	init: function(grid) {
		this.grid = grid;
		
		this.menu = new Ext.menu.Menu({
			floating: true,
			renderTo: Ext.getBody(),
			items: [{
				text: i18n("Export"),
				icon: 'resources/fugue-icons/icons/application-export.png',
				menu: [{
					icon: 'resources/mimetypes/csv.png',
					text: 'Export as CSV (.csv)',
					handler: this.exportCSV,
					scope: this
				},{
					icon: 'resources/fugue-icons/icons/blue-document-excel.png',
					text: 'Export as Excel XML (.xlsx)',
					handler: this.exportXLSX,
					scope: this
				},{
					icon: 'resources/icons/mediawiki_icon.png',
					text: 'Export as MediaWiki table (.txt)',
					handler: this.exportWiki,
					scope: this
				}]
			}]
		});
		
		// Show the menu when an item was clicked
		grid.on("itemcontextmenu", function (view, record, item, index, e, eOpts) {
			this.menu.showAt(e.xy[0], e.xy[1]);
		}, this);
		
		// Show the menu when no item but the grid was clicked
		grid.on("containercontextmenu", function (view, e, eOpts) {
			this.menu.showAt(e.xy[0], e.xy[1]);
		}, this);
	},
	/**
	 * Exports the grid to CSV
	 */
	exportCSV: function () {
		this.doExport(Ext.ux.exporter.Exporter.exportAny(this.grid, "csv", {}), this.getExportFilename() + ".csv");
	},
	/**
	 * Exports the grid to MediaWiki format
	 */
	exportWiki: function () {
		this.doExport(Ext.ux.exporter.Exporter.exportAny(this.grid, "wiki", {}), this.getExportFilename() + ".txt");
	},
	/**
	 * Exports the grid to XLSX
	 */
	exportXLSX: function () {
		this.doExport(Ext.ux.exporter.Exporter.exportAny(this.grid, "excel", {}), this.getExportFilename() + ".xlsx");
	},
	/**
	 * Returns the filename without extension for the grid. Defaults to the grid's title
	 * @returns {String} the filename
	 */
	getExportFilename: function () {
		return this.grid.title;
	},
	/**
	 * Triggers the export. Calls the jsonUpload method and redirects to the uploaded file.
	 * 
	 * @param data {String} The data 
	 * @param filename {String} The filename
	 */
	doExport: function (data, filename) {
		var call = new PartKeepr.ServiceCall("TempFile", "jsonUpload");
		call.setParameter("filedata", Ext.ux.exporter.Base64.encode(data));
		call.setParameter("filename", filename);
		call.setHandler(function (response) {
			var loc = "file.php?type=temp&download=true&id=TMP:"+response.id;
			
			window.location.href = loc;
		});
		call.doCall();
	}
});
Ext.define('PartKeepr.CategoryEditorWindow', {
	extend: 'Ext.window.Window',
	border: false,
	width: 400,
	categoryModel: null,
	initComponent: function () {
		
		this.form = Ext.create("PartKeepr.CategoryEditorForm");
		
		this.keys = [{
			key: Ext.EventObject.ENTER,
			handler: this.onEnter,
			scope: this
		}];
		
		this.buttons = [{
			text: i18n("Save"),
			handler: Ext.bind(this.onSave, this)
		},{
			text: i18n("Cancel"),
			handler: Ext.bind(this.onCancel, this)
		}];
		
		this.items = this.form;

		this.addEvents("save");
		
		this.callParent();
		
		this.proxyRecord = Ext.create(this.categoryModel);
		
		if (this.record) {
			this.proxyRecord.set("name", this.record.get("name"));
			this.proxyRecord.set("description", this.record.get("description"));
			this.proxyRecord.set("id", this.record.get("id"));
			this.proxyRecord.phantom = false;
			
			this.setTitle(i18n("Edit Category"));
		} else {
			this.proxyRecord.set("parent", this.parent);
			this.setTitle(i18n("Add Category"));
		}
		
		this.form.getForm().loadRecord(this.proxyRecord);
		
		this.on("show", Ext.bind(this.onShow, this));
		
	},
	onEnter: function () {
		this.onSave();
	},
	onShow: function () {
		this.form.items.first().focus();
	},
	onSave: function () {
		this.form.getForm().updateRecord(this.proxyRecord);
		this.proxyRecord.save({
			success: Ext.bind(function (response) {
				this.fireEvent("save", response);
				this.destroy();
			}, this)
		});
	},
	onCancel: function () {
		this.destroy();
	}
});

Ext.define('PartKeepr.CategoryEditorForm', {
	extend: 'Ext.form.Panel',
	layout: 'anchor',
	border: false,
	frame: false,
	bodyStyle: 'background:#DBDBDB;padding: 10px;',
	items: [{
		xtype: 'textfield',
		name: 'name',
		anchor: '100%',
		fieldLabel: i18n("Name")
	},{
		xtype: 'textarea',
		name: 'description',
		anchor: '100%',
		fieldLabel: i18n("Description")
	}]
});
Ext.define('PartKeepr.UserPasswordChangePanel', {
	extend: 'Ext.form.FormPanel',
	title: i18n("Change Password"),
	bodyStyle: 'background:#DBDBDB;padding: 10px;',
	initComponent: function () {

		this.oldPassword = Ext.create("Ext.form.field.Text", {
			inputType: "password",
			name: 'password',
			labelWidth: 150,
			style: 'border-bottom: 1px solid grey; padding-bottom: 10px;',
			width: 300,
			fieldLabel: i18n("Current Password")
		});
		
		this.newPassword = Ext.create("Ext.form.field.Text", {
			style: 'margin-top: 10px',
			inputType: "password",
			name: 'password',
			labelWidth: 150,
			width: 300,
			fieldLabel: i18n("New Password")
		});
		
		this.newPasswordConfirm = Ext.create("Ext.form.field.Text", {
			inputType: "password",
			name: 'password',
			labelWidth: 150,
			width: 300,
			validator: Ext.bind(this.validatePassword, this),
			fieldLabel: i18n("New Password (Confirm)")
		});
		
		this.items = [
		              this.oldPassword,
		              this.newPassword,
		              this.newPasswordConfirm,
				{
					 xtype: 'fieldcontainer',
					 hideEmptyLabel: false,
					 width: 300,
					 labelWidth: 150,
					 items: {
							xtype: 'button',
							handler: this.onChangePassword,
							scope: this,
							width: 145,
							icon: 'resources/silkicons/accept.png',
							text: i18n("Change Password")
						}
				}];
		
		this.callParent();
	},
	onChangePassword: function () {
		if (this.getForm().isValid()) {

			var call = new PartKeepr.ServiceCall("UserPreference", "changePassword");
			call.setParameter("oldpassword", md5(this.oldPassword.getValue()));
			call.setParameter("newpassword", md5(this.newPassword.getValue()));
			call.setHandler(Ext.bind(this.onAfterPasswordChange, this));
			call.doCall();
		}
	},
	onAfterPasswordChange: function (data) {
		Ext.Msg.alert(data.data, data.data);
	},
	validatePassword: function () {
		if (this.newPassword.getValue() != this.newPasswordConfirm.getValue()) {
			return i18n("Passwords don't match");
		}
		
		return true;
	}
});
Ext.define('PartKeepr.StockPreferencesPanel', {
	extend: 'Ext.form.FormPanel',
	title: i18n("Stock Preferences"),
        bodyStyle: 'background:#DBDBDB;padding: 10px;',
        initComponent: function () {
            this.confirmInlineStockLevelChangesCheckbox = Ext.create("Ext.form.field.Checkbox", {
                boxLabel: i18n("Confirm in-line stock level changes from the parts grid"),
                handler: Ext.bind(this.confirmInlineStockLevelChangesHandler, this)
            });
            
            if (PartKeepr.getApplication().getUserPreference("partkeepr.inline-stock-change.confirm") === false) {
    			this.confirmInlineStockLevelChangesCheckbox.setValue(false);
    		} else {
    			this.confirmInlineStockLevelChangesCheckbox.setValue(true);
    		}
            
            this.items = [ this.confirmInlineStockLevelChangesCheckbox ];
                   
            this.callParent();
    },
    /**
	 * Handler when the "confirm changes" checkbox was clicked. 
	 */
    confirmInlineStockLevelChangesHandler: function (checkbox, checked) {
		PartKeepr.getApplication().setUserPreference("partkeepr.inline-stock-change.confirm", checked);
	}
});
        
Ext.define('PartKeepr.TipOfTheDayPreferencesPanel', {
	extend: 'Ext.form.FormPanel',
	title: i18n("Tip of the Day"),
        bodyStyle: 'background:#DBDBDB;padding: 10px;',
        initComponent: function () {
            this.displayTipsOnLoginCheckbox = Ext.create("Ext.form.field.Checkbox", {
                boxLabel: i18n("Display tips on login"),
                handler: Ext.bind(this.showTipsHandler, this)
            });
            
            if (PartKeepr.getApplication().getUserPreference("partkeepr.tipoftheday.showtips") === false) {
    			this.displayTipsOnLoginCheckbox.setValue(false);
    		} else {
    			this.displayTipsOnLoginCheckbox.setValue(true);
    		}
            
            
            this.resetTipsButton = Ext.create("Ext.button.Button", {
                text: i18n("Mark all tips unread"),
                handler: this.onMarkAllTipsUnreadClick,
                scope: this
            });
            
            this.items = [ this.displayTipsOnLoginCheckbox,
                           this.resetTipsButton ];
                   
            this.callParent();
    },
    /**
	 * Handler when the "show tips" checkbox was clicked. 
	 */
	showTipsHandler: function (checkbox, checked) {
		PartKeepr.getApplication().setUserPreference("partkeepr.tipoftheday.showtips", checked);
	},
	/**
	 * Marks all tips as unread
	 */
	onMarkAllTipsUnreadClick: function () {
		var call = new PartKeepr.ServiceCall("TipOfTheDay", "markAllTipsAsUnread");
		call.setLoadMessage(i18n("Marking all tips as unerad..."));
		call.setHandler(function () {
			var msg = i18n("All tips have been marked as unread");
			Ext.Msg.alert(msg, msg);
		});
		call.doCall();
	}
});
        
Ext.define('PartKeepr.UserPreferencePanel', {
	extend: 'Ext.tab.Panel',
	title: i18n("User Preferences"),
	tabPosition: 'bottom',
	//bodyStyle: 'background:#DBDBDB;padding: 10px;',
	initComponent: function () {
		
		this.passwordChangePanel = Ext.create("PartKeepr.UserPasswordChangePanel");
		this.tipsPanel = Ext.create("PartKeepr.TipOfTheDayPreferencesPanel");
        this.stockPanel = Ext.create("PartKeepr.StockPreferencesPanel");
		this.items = [ this.tipsPanel, this.passwordChangePanel, this.stockPanel ];
		this.callParent();
	}
});
Ext.define("PartKeepr.UserComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.UserComboBox',
    displayField: 'username',
    valueField: 'id',
    autoSelect: true,
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    editable: true,
    initComponent: function () {
		this.store = PartKeepr.getApplication().getUserStore();
		
		/* Workaround to remember the value when loading */
		this.store.on("beforeload", function () {
			this._oldValue = this.getValue();
		}, this);
		
		/* Set the old value when load is complete */
		this.store.on("load", function () {
			this.setValue(this._oldValue);
		}, this);
		
		this.callParent();
    }
});


Ext.define("PartKeepr.ManufacturerComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.ManufacturerComboBox',
    displayField: 'name',
    valueField: 'id',
    autoSelect: true,
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    editable: true,
    initComponent: function () {
		this.store = PartKeepr.getApplication().getManufacturerStore();
		
		/* Workaround to remember the value when loading */
		this.store.on("beforeload", function () {
			this._oldValue = this.getValue();
		}, this);
		
		/* Set the old value when load is complete */
		this.store.on("load", function () {
			this.setValue(this._oldValue);
		}, this);
		
		this.callParent();
    }
});


Ext.define("PartKeepr.CategoryComboBox",{
    extend:"Ext.form.field.Picker",
    alias: 'widget.CategoryComboBox',
    requires:["Ext.tree.Panel"],
    selectedValue: null,
    initComponent: function(){
        var self = this;

        Ext.apply(self,{
            pickerAlign:"tl-bl?",
            editable: false
            	
        });

        self.callParent();
        
        this.createPicker();

    },
    createPicker: function(){
        var self = this;

        self.picker = new PartKeepr.CategoryTree({
            height:290,
            categoryService: 'PartCategory',
            categoryModel: 'PartKeepr.PartCategory',
            floating: true,
            focusOnToFront: false,
            shadow: false,
            ownerCt: this.ownerCt
        });

        self.picker.on({
            itemclick: Ext.bind(function(sm, record){
            	this.setValue(record.get("name"), true);
            	this.setSelectedValue(record.get("id"));
                this.collapse();
            },this),
            show: {
            	fn: Ext.bind(function(cmp) {
            		var record = this.picker.getSelectionModel().getLastSelected();
            		
            		this.picker.getView().focusRow(record);
            	}, this),
            	delay: 50
            }
        });
        
        self.picker.getView().on("render", Ext.bind(function () {
        	var record = this.picker.getSelectionModel().getLastSelected();
        	this.picker.getView().ensureVisible(record);
        	
        	this.picker.getView().focusRow(record);
        },this));
        
        return self.picker;
    },
    setSelectedValue: function (id) {
    	this.selectedValue = id;
    },
    getValue: function () {
    	return this.selectedValue;
    },
    setValue: function (val, parent) {
    	if (parent) {
    		this.callParent([val]);
    	}
    	
    	if (!this.picker) { return; }
    	
    	if (!this.picker.loaded) {
    		this.picker.on("categoriesLoaded", function () { this._setValue(val); }, this);
    	} else {
    		this._setValue(val);
    	}
    },
    _setValue: function (val) {
    	var r = this.findById(val);
    	
    	/* We have found a record. Apply it */
    	if (r !== null) {
    		this.setSelectedValue(r.get("id"));
    		this.setValue(r.get("name"), true);
    		
    		if (this.picker.getView().rendered) {
    			this._selectRecords(r);
    		} else {
    			this.picker.getView().on("render", function () { this._selectRecords(r); }, this);
    		}
    		
    	}
    },
    _selectRecords: function (r) {
    	this.picker.getView().select(r);
		this.picker.getView().ensureVisible(r);
		this.picker.getView().scrollIntoView(r);
    },
    findById: function (id) {
    	return this.picker.getRootNode().findChild("id", id, true);
    },
    alignPicker: function() {
        // override the original method because otherwise the height of the treepanel would be always 0
        var me = this,
                picker, isAbove,
                aboveSfx = '-above';

        if (this.isExpanded) {
            picker = me.getPicker();
            if (me.matchFieldWidth) {
                // Auto the height (it will be constrained by min and max width) unless there are no records to display.
                picker.setWidth( me.bodyEl.getWidth());
            }
            if (picker.isFloating()) {
                picker.alignTo(me.inputEl, me.pickerAlign, me.pickerOffset);

                // add the {openCls}-above class if the picker was aligned above
                // the field due to hitting the bottom of the viewport
                isAbove = picker.el.getY() < me.inputEl.getY();
                me.bodyEl[isAbove ? 'addCls' : 'removeCls'](me.openCls + aboveSfx);
                picker.el[isAbove ? 'addCls' : 'removeCls'](picker.baseCls + aboveSfx);
            }
        }
    },
    getErrors: function(value) {
    	if (this.getValue() === null) {
    		return [ i18n("You need to select a category")];
    	}
    	
    	return [];
    }
});
Ext.define("PartKeepr.StorageLocationComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.StorageLocationComboBox',
    displayField: 'name',
    valueField: 'id',
    queryMode: 'local',
    triggerAction: 'all',
    
    trigger2Cls: Ext.baseCSSPrefix + 'form-reload-trigger',
    
    onTrigger1Click: function () {
    	this.onTriggerClick();
    },
    onTrigger2Click: function () {
    	this.expand();
    	this.store.load();
    },
    initComponent: function () {
		this.store = Ext.create("Ext.data.Store",
			{
				model: 'PartKeepr.StorageLocation',
				proxy: PartKeepr.getRESTProxy("StorageLocation"),
				pageSize: -1,
				autoLoad: true
			});
		
		this.callParent();
    }
});


Ext.define("PartKeepr.UnitComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.UnitComboBox',
    displayField: 'name',
    valueField: 'id',
    autoSelect: true,
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    editable: true,  
    initComponent: function () {
		this.store = PartKeepr.getApplication().getUnitStore();
		
		/* Workaround to remember the value when loading */
		this.store.on("beforeload", function () {
			this._oldValue = this.getValue();
		}, this);
		
		/* Set the old value when load is complete */
		this.store.on("load", function () {
			this.setValue(this._oldValue);
		}, this);
		
		this.callParent();
    }
});


/**
 * This class represents a field which can handle a number (value) bound to a specific SI prefix.
 * 
 * Internally, we use an object as value. Example:
 * 
 * {
 *     value: 10 		// The base value, in our case 10
 *     symbol: "n" 		// The symbol for display
 *     power: -9    	// The power
 *     siprefix_id: 5	// The ID of the siprefix record  
 * }
 * 
 */
Ext.define("PartKeepr.SiUnitField",{
    extend:"Ext.form.field.Picker",
    alias: 'widget.SiUnitField',
    
    siPrefix: null,
    
    /**
     * @cfg {RegExp} stripCharsRe @hide
     */
    /**
     * @cfg {RegExp} maskRe @hide
     */

    /**
     * @cfg {Boolean} allowDecimals False to disallow decimal values (defaults to true)
     */
    allowDecimals : true,

    /**
     * @cfg {String} decimalSeparator Character(s) to allow as the decimal separator (defaults to '.')
     */
    decimalSeparator : '.',

    /**
     * @cfg {Number} decimalPrecision The maximum precision to display after the decimal separator (defaults to 2)
     */
    decimalPrecision : 2,

    /**
     * @cfg {Number} minValue The minimum allowed value (defaults to Number.NEGATIVE_INFINITY). Will be used by
     * the field's validation logic.
     */
    minValue: Number.NEGATIVE_INFINITY,

    /**
     * @cfg {Number} maxValue The maximum allowed value (defaults to Number.MAX_VALUE). Will be used by
     * the field's validation logic.
     */
    maxValue: Number.MAX_VALUE,

    /**
     * @cfg {String} minText Error text to display if the minimum value validation fails (defaults to 'The minimum
     * value for this field is {minValue}')
     */
    minText : 'The minimum value for this field is {0}',

    /**
     * @cfg {String} maxText Error text to display if the maximum value validation fails (defaults to 'The maximum
     * value for this field is {maxValue}')
     */
    maxText : 'The maximum value for this field is {0}',

    /**
     * @cfg {String} nanText Error text to display if the value is not a valid number.  For example, this can happen
     * if a valid character like '.' or '-' is left in the field with no number (defaults to '{value} is not a valid number')
     */
    nanText : '{0} is not a valid number',

    /**
     * @cfg {String} negativeText Error text to display if the value is negative and {@link #minValue} is set to
     * <tt>0</tt>. This is used instead of the {@link #minText} in that circumstance only.
     */
    negativeText : 'The value cannot be negative',

    /**
     * @cfg {String} baseChars The base set of characters to evaluate as valid numbers (defaults to '0123456789').
     */
    baseChars : '0123456789',

    /**
     * @cfg {Boolean} autoStripChars True to automatically strip not allowed characters from the field. Defaults to <tt>false</tt>
     */
    autoStripChars: false,

    initComponent: function() {
        var me = this,
            allowed;

        me.callParent();

        me.setMinValue(me.minValue);
        me.setMaxValue(me.maxValue);

        // Build regexes for masking and stripping based on the configured options
        if (me.disableKeyFilter !== true) {
            allowed = me.baseChars + '';
            
            var store = PartKeepr.getApplication().getSiPrefixStore();
        	
        	for (var i=0;i<store.count();i++) {
        		allowed += store.getAt(i).get("symbol");
        	}
        	
        	/**
        	 * Fix because the µ-symbol on your keyboard is not greek "Mu" as defined by the Si standard. We wish that
        	 * the user still can enter "µ", which automatically gets converted to "Mu".
        	 */
        	allowed += "µ";
        	
            if (me.allowDecimals) {
                allowed += me.decimalSeparator;
            }
            if (me.minValue < 0) {
                allowed += '-';
            }
            allowed = Ext.String.escapeRegex(allowed);
            me.maskRe = new RegExp('[' + allowed + ']');
            if (me.autoStripChars) {
                me.stripCharsRe = new RegExp('[^' + allowed + ']', 'gi');
            }
        }
    },
    onTriggerClick: function () {
    	this.expand();
    	
    	var node = this.picker.getNode(this.siPrefix);
    	
    	if (node) {
    		this.picker.highlightItem(node);
        	this.picker.listEl.scrollChildIntoView(node, false);	
    	}
    },
    getStore: function () {
    	if (this.store) {
    		return this.store;
    	}
    	
    	return PartKeepr.getApplication().getSiPrefixStore();
    },
    setStore: function (store) {
    	if (this.picker) {
    		this.picker.bindStore(store);
    	} else {
    		this.store = store;
    	}
    },
    createPicker: function() {
    	var siprefixtpl = new Ext.XTemplate(
    		    '<tpl for=".">',
    		        '<div class="thumb-wrap">',
    		          '{symbol} {prefix}',
    		        '</div>',
    		    '</tpl>');
    	
    	var tmp = Ext.create('PartKeepr.SiUnitList', {
    	    store: this.getStore(),
    	    singleSelect: true,
    	    ownerCt: this.ownerCt,
            renderTo: document.body,
            //width: 200,
            //height:200,
            floating: true,
            maxHeight: 300,
            shadow: 'sides',
            focusOnToFront: false,
            hidden: true,
            focusOnShow: true,
            displayField: 'symbol',
            isteners: {
                scope: this,
                itemclick: this.onSelect
            }
    	});
    	
    	this.mon(tmp, {
             itemclick: this.onSelect,
             scope: this
         });
        return tmp;
    },
    onSelect: function (t, rec) {
    	var val = this.getValue();
    	
    	val.symbol = rec.get("symbol");
    	val.power = rec.get("power");
    	val.siprefix_id = rec.get("id");
    	
    	//this.siUnit = rec;
    	this.setValue(val);
    	this.collapse();
    },
    /**
     * Runs all of Number's validations and returns an array of any errors. Note that this first
     * runs Text's validations, so the returned array is an amalgamation of all field errors.
     * The additional validations run test that the value is a number, and that it is within the
     * configured min and max values.
     * @param {Mixed} value The value to get errors for (defaults to the current field value)
     * @return {Array} All validation errors for this field
     */
    getErrors: function(value) {
        var me = this,
            errors = me.callParent(arguments),
            format = Ext.String.format,
            num, retVal;

        retVal = Ext.isDefined(value) ? value : this.processRawValue(this.getRawValue());
        
        value = retVal.value;
        
        if (value.length < 1) { // if it's blank and textfield didn't flag it then it's valid
             return errors;
        }

        value = String(value).replace(me.decimalSeparator, '.');

        if(isNaN(value)){
            errors.push(format(me.nanText, value));
        }

        num = me.parseValue(value);

        if (me.minValue === 0 && num < 0) {
            errors.push(this.negativeText);
        }
        else if (num < me.minValue) {
            errors.push(format(me.minText, me.minValue));
        }

        if (num > me.maxValue) {
            errors.push(format(me.maxText, me.maxValue));
        }


        return errors;
    },
    rawToValue: function(rawValue) {
    	var processValue;
    	
    	if (Ext.isObject(rawValue)) {
    		processValue = rawValue.value;
    	} else {
    		processValue = rawValue;
    	}
    	
    	return this.fixPrecision(this.parseValue(processValue)) || processValue || null;
    },

    valueToRaw: function(value) {
        var me = this,
            decimalSeparator = me.decimalSeparator;
        value = me.parseValue(value);
        value = me.fixPrecision(value);
        value = Ext.isNumber(value) ? value : parseFloat(String(value).replace(decimalSeparator, '.'));
        value = isNaN(value) ? '' : String(value).replace('.', decimalSeparator);
        
        if (Ext.isObject(this.siPrefix) && this.siPrefix.get("symbol") !== "") {
        	return value + " "+this.siPrefix.get("symbol");
        } else {
        	return value;
        }
        
    },

    onChange: function() {
        var me = this,
            value = me.getValue(),
            valueIsNull = value === null;
        
        me.callParent(arguments);
    },
    getValue: function () {
    	var v = this.callParent(arguments);
    	
    	if (this.siPrefix) {
    		return {
        		value: v,
        		symbol: this.siPrefix.get("symbol"),
        		power: this.siPrefix.get("power"),
        		siprefix_id: this.siPrefix.get("id")
        		};
    	} else {
    		return {
    			value: v,
    			symbol: "",
    			power: 1,
    			siprefix_id: null
    		};
    	}
    },
    /**
     * Replaces any existing {@link #minValue} with the new value.
     * @param {Number} value The minimum value
     */
    setMinValue : function(value) {
        this.minValue = Ext.Number.from(value, Number.NEGATIVE_INFINITY);
    },

    /**
     * Replaces any existing {@link #maxValue} with the new value.
     * @param {Number} value The maximum value
     */
    setMaxValue: function(value) {
        this.maxValue = Ext.Number.from(value, Number.MAX_VALUE);
    },

    // private
    parseValue : function(value) {
        value = parseFloat(String(value).replace(this.decimalSeparator, '.'));
        return isNaN(value) ? null : value;
    },

    /**
     * @private
     *
     */
    fixPrecision : function(value) {
        var me = this,
            nan = isNaN(value),
            precision = me.decimalPrecision;

        if (nan || !value) {
            return nan ? '' : value;
        } else if (!me.allowDecimals || precision <= 0) {
            precision = 0;
        }

        return parseFloat(Ext.Number.toFixed(parseFloat(value), precision));
    },

    beforeBlur : function() {
        var me = this,
            v = me.parseValue(me.getRawValue());

        if (!Ext.isEmpty(v)) {
            me.setValue(v);
        }
    },
    findSiPrefix: function (value) {
    	var store = PartKeepr.getApplication().getSiPrefixStore();
    	var symbol;
    	
    	for (var i=0;i<store.count();i++) {
    		
    		symbol = store.getAt(i).get("symbol");
    		
    		if (symbol !== "") {
    			if (strpos(value, symbol) !== false) {
        			return store.getAt(i);
        		}	
    		} else {
    			emptyPrefix = store.getAt(i);
    		}
    		
    	}
    	
    	if (emptyPrefix) {
    		return emptyPrefix;
    	} else {
    		return null;
    	}
    },
    setValue: function (v) {
    	if (Ext.isObject(v)) {
    		this.siPrefix = PartKeepr.getApplication().getSiPrefixStore().getById(v.siprefix_id);
    	
    		return this.callParent([v.value]);
    	} else {
    		return v;
    	}
    },
    processRawValue: function (value) {
    	var prefix;
    	
    	value = PartKeepr.getApplication().convertMicroToMu(value);
    	
        var siPrefix = this.findSiPrefix(value);

        this.siPrefix = siPrefix;
        
        if (siPrefix !== null) {
        	value = str_replace(siPrefix.get("symbol"), "", value);
        	return { value: value, symbol: siPrefix.get("symbol"), power: siPrefix.get("power"), siprefix_id: siPrefix.get("id") };
        } else {
        	return { value: value, symbol: "", power: 0, siprefix_id: null };
        }
    }
});
Ext.define("PartKeepr.PartParameterComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.PartParameterComboBox',
    displayField: 'name',
    valueField: 'name',
    autoSelect: false,
    allowBlank: false,
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: false,
    editable: true,
    initComponent: function () {
		//this.store = PartKeepr.getApplication().getPartUnitStore();
    	
    	this.store = Ext.create("Ext.data.Store", {
    		fields: [{ name: 'name' }],
    		proxy: {
    			type: 'ajax',
    			url: PartKeepr.getBasePath() + "/Part/getPartParameterNames",
    			reader: {
    				type: 'json',
    				root: 'response.data'
    			}
    		}
    	});
    	
    	this.store.load();
		
		/* Workaround to remember the value when loading */
		this.store.on("beforeload", function () {
			this._oldValue = this.getValue();
		}, this);
		
		/* Set the old value when load is complete */
		this.store.on("load", function () {
			this.setValue(this._oldValue);
		}, this);
		
		this.callParent();
    }
});


/**
 * Represents a part combobox which supports type-ahead and remote querying. 
 */
Ext.define("PartKeepr.RemotePartComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.RemotePartComboBox',
    displayField: 'name',
    valueField: 'id',
    queryMode: 'remote',
    triggerAction: 'all',
    typeAhead: true,
    typeAheadDelay: 100,
    pageSize: 30,
    minChars: 2,
    forceSelection: true,
    initComponent: function () {
    	this.store = Ext.create("Ext.data.Store",
    			{
    				model: 'PartKeepr.Part',
    				proxy: PartKeepr.getRESTProxy("Part"),
    				autoLoad: true
    			});
		this.callParent();
    }
});


Ext.define("PartKeepr.ResistorDisplay",{
    extend:"Ext.draw.Component",
    alias: 'widget.ResistorDisplay',
    
    viewBox: false,
    initComponent: function () {
    	
    	this.circle = Ext.create("Ext.draw.Sprite", {
    		type: 'circle',
            fill: '#79BB3F',
            radius: 100,
            x: 100,
            y: 100
    	});
    	
    	this.items = [ this.circle ];
    	
    	this.callParent();
    	
    	this.circle = this.surface;
    	

    }
});
/**
 * Creates a panel with a webcam widget. The webcam widget is
 * a flash (jpegcam).
 */
Ext.define('PartKeepr.WebcamPanel', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.WebcamPanel',
	initComponent: function () {
		
		this.takePhotoButton = Ext.create("Ext.button.Button", {
			text: i18n("Take picture and upload"),
        	icon: 'resources/fugue-icons/icons/webcam.png',
        	handler: this.takePhoto
		});
		
		// Create a toolbar with the "take photo" button
		this.bbar = Ext.create("Ext.toolbar.Toolbar", {
			enableOverflow: true,
			items: [ this.takePhotoButton ]
		});
		
		// Render the SWF
		this.on("afterrender", this.renderWebcam, this);
		
		// Fires when the image upload is complete
		this.addEvents("uploadComplete");
		this.callParent();
	},
	/**
	 * Renders the webcam swf.
	 * @param e The element for this component
	 */
	renderWebcam: function (e) {
		webcam.set_swf_url("resources/webcam.swf");
		webcam.set_quality(90);
		webcam.set_api_url(PartKeepr.getBasePath()+"?service=TempFile&call=uploadCam&session="+PartKeepr.getApplication().getSession());
		webcam.set_shutter_sound(false);
		webcam.set_hook('onComplete', Ext.bind(this.onUploadComplete, this));
		
		e.body.insertHtml('beforeEnd', webcam.get_html(640,480, 640, 480));
	},
	/**
	 * Takes a photo using the webcam.
	 */
	takePhoto: function () {
		webcam.snap();
		this.takePhotoButton.disable();
		this.takePhotoButton.setText(i18n("Uploading..."));
	},
	/**
	 * Called when the upload is complete. Resumes webcam operation
	 * and fires the event. 'uploadComplete'
	 * @param message	The server side message
	 */
	onUploadComplete: function (message) {
		var response = Ext.decode(message);
		
		webcam.reset();
		this.fireEvent("uploadComplete", response.response);
		
	}
});
Ext.define("PartKeepr.ResistorCalculator",{
    extend:"Ext.window.Window",
    alias: 'widget.ResistorCalculator',
    
    width: 300,
    height: 300,
    layout: 'fit',
    initComponent: function () {
    	
    	//this.resistorValueField = Ext.create("Ext.form.field.Number");
    	this.resistorDisplay = Ext.create("PartKeepr.ResistorDisplay", {
    		viewBox: false
    	});
    	
    	/*this.resistorDisplay = Ext.create('Ext.draw.Component', {
    	    viewBox: false,
    	    items: [{
    	        type: 'circle',
    	        fill: '#79BB3F',
    	        radius: 100,
    	        x: 100,
    	        y: 100
    	    }]
    	});*/ 
    	
    	this.items = [ this.resistorDisplay ];
    	this.callParent();
    }
});
// Not sure if this one is really needed.

Ext.define('PartKeepr.RemoteImageFieldLayout', {

    /* Begin Definitions */

    alias: ['layout.remoteimagefield'],

    extend: 'Ext.layout.component.field.Field',

    /* End Definitions */

    type: 'remoteimagefield',

    sizeBodyContents: function(width, height) {
        var me = this,
            owner = me.owner,
            inputEl = owner.inputEl,
            triggerWrap = owner.triggerWrap,
            triggerWidth = owner.getTriggerWidth();

        // If we or our ancestor is hidden, we can get a triggerWidth calculation
        // of 0.  We don't want to resize in this case.
        if (owner.hideTrigger || owner.readOnly || triggerWidth > 0) {
            // Decrease the field's width by the width of the triggers. Both the field and the triggerWrap
            // are floated left in CSS so they'll stack up side by side.
            me.setElementSize(inputEl, Ext.isNumber(width) ? width - triggerWidth : width);
    
            // Explicitly set the triggerWrap's width, to prevent wrapping
            triggerWrap.setWidth(triggerWidth);
        }
    }
});
Ext.define("PartKeepr.DistributorComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.DistributorComboBox',
    displayField: 'name',
    valueField: 'id',
    autoSelect: true,
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    editable: true,
    ignoreQuery: false,
    initComponent: function () {
		this.store = PartKeepr.getApplication().getDistributorStore();
		
		/* Workaround to remember the value when loading */
		this.store.on("beforeload", function () {
			this._oldValue = this.getValue();
		}, this);
		
		/* Set the old value when load is complete */
		this.store.on("load", function () {
			this.setValue(this._oldValue);
		}, this);
		
		this.callParent();
    },
    onTriggerClick: function() {
    	if (!this.ignoreQuery) {
    		this.callParent();
    	} else {
    		var me = this;
            if (!me.readOnly && !me.disabled) {
                if (me.isExpanded) {
                    me.collapse();
                } else {
                    me.onFocus({});
                    me.expand();
                }
                me.inputEl.focus();
            }	
    	}
        
    }
});


Ext.define('PartKeepr.ConnectionButton', {
	extend: 'Ext.Button',
	connectedIcon: 'resources/silkicons/connect.png',
	disconnectedIcon: 'resources/silkicons/disconnect.png',
	cls: 'x-btn-icon',
	icon: 'resources/silkicons/disconnect.png',
	//tooltip: i18n("Disconnected"),
	setConnected: function () {
		this.setIcon(this.connectedIcon);
		//this.setTooltip(i18n("Connected"));
	},
	setDisconnected: function () {
		this.setIcon(this.disconnectedIcon);
		//this.setTooltip(i18n("Disconnected"));
	}
});


Ext.define("PartKeepr.FootprintComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.FootprintComboBox',
    displayField: 'name',
    valueField: 'id',
    autoSelect: true,
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    editable: true,
    initComponent: function () {
		this.store = PartKeepr.getApplication().getFootprintStore();
		
		/* Workaround to remember the value when loading */
		this.store.on("beforeload", function () {
			this._oldValue = this.getValue();
		}, this);
		
		/* Set the old value when load is complete */
		this.store.on("load", function () {
			this.setValue(this._oldValue);
		}, this);
		
		this.callParent();
    }
});


/**
 * @class PartKeepr.RemoteImageField
 * <p>The RemoteImageField is a form field which can be used to upload one image. It automatically
 * displays the remote image by id, assigns a temporary ID if it's a new image so the model can be
 * syncronized at once.
 * 
 */
Ext.define('PartKeepr.RemoteImageField', {
    extend:'Ext.form.field.Base',
    alias: 'widget.remoteimagefield',
    
    type: 'remoteimagefield',
    
    // Default width and height
    imageWidth: 32,
    imageHeight: 32,
    
    // The field template for rendering this field
    fieldSubTpl: [
                  '<img id="{cmpId}-imgEl" style="{size}" class="remoteimagefield"/>',
                  {
                      compiled: true,
                      disableFormats: true
                  }],
              
    /**
     * Initializes the field
   	 */          
    initComponent : function(){
    	this.minHeight = this.imageHeight;
    	this.minWidth = this.imageWidth;
    	
    	this.imageId = Ext.id("remoteimagefield");
        this.callParent();
    },
    /**
     * Return the template data for this field
     */
    getSubTplData: function() {
    	return {
    		cmpId: this.id,
            size: 'height:'+this.imageHeight+"px;width:"+this.imageWidth+"px;",
            imageid: this.imageId
    	};
    },
    /**
     * Renders this field.
     */
    onRender: function() {
        var me = this;

        me.onLabelableRender();

        me.addChildEls('imgEl');

        me.callParent(arguments);
    },
    /*onRender: function () {
    	 var me = this,
         renderSelectors = me.renderSelectors;

    	 Ext.applyIf(renderSelectors, me.getLabelableSelectors());

    	 Ext.applyIf(renderSelectors, {
    		 imgEl: 'img.remoteimagefield'
    	 });

    	 me.callParent(arguments);
    },*/
    /**
     * Applies the image URL to the element after rendering
     */
    afterRender: function () {
    	this.imgEl.dom.src = this.getImageURL();
    	
    	this.imgEl.on("click", this.onClick, this);
    },
    onClick: function () {
    	var j = Ext.create("PartKeepr.FileUploadDialog", { imageUpload: true });
    	j.on("fileUploaded", this.onFileUploaded, this);
    	j.show();
    },
    onFileUploaded: function (data) {
    	this.setValue("TMP:"+data.id);
    },
    /**
     * Returns the URL for the image field. Applies the temporary image if TMP: is
     * found within the value.
     */
    getImageURL: function () {
    	var idparam;
    	
    	if (strpos(this.value, "TMP:") !== false) {
    		idparam = "id=0&tmpId="+str_replace("TMP:","",this.value);
    	} else {
    		idparam = "id="+this.value;
    	}
    	
    	return PartKeepr.getImagePath() + "?"+idparam+"&type="+this.imageType+"&w="+this.imageWidth+"&h="+this.imageHeight+"&m=fitpadding&_dc="+Ext.Date.now();
    	
    },
    /**
     * Sets a value for the field. If the value is numeric, we call the image service
     * with the specified id and the specified type. If the value is a string and prefixed
     * with TMP:, we use the type "TempImage" and pass the id which has to be specified after TMP:.
     * 
     * Example
     * TMP:12     would retrieve the temporary image with the ID 12
     * @param {Mixed} value The value to set
     * @return {Ext.form.field.Field} this
     */
    setValue: function(value) {
    	var me = this;
    	
    	this.setRawValue(value);
    	this.value = value;
    	if (this.rendered) {
    		this.imgEl.dom.src = this.getImageURL();
    	}
        return this;
    }
});


Ext.define('PartKeepr.SiUnitList', {
    extend: 'Ext.view.BoundList',
    alias: 'widget.siunitlist',
    getInnerTpl: function(displayField) {
        return '<span style="display: inline-block; width: 15px;">{' + displayField + '}</span><span style="display: inline-block; width: 40px;">{prefix}</span>(10<sup>{power}</span>)';
    }
});
Ext.define('PartKeepr.FadingButton', {
	extend: 'Ext.Button',
	initComponent: function () {
		this.callParent();
		
	},
	startFading: function () {
		var iconEl = this.getEl().down(".x-btn-inner");
		
		iconEl.animate({
			duration: 1000,
			iterations: 1, // Should be enough for any session,
			listeners: {
				afteranimate: function () {
					if (this.fadeRunning) {
						// Not sure why defer is needed, but without it, it won't work.
						Ext.defer(this.startFading, 100, this);	
					}
				},
				scope: this
			},
		    keyframes: {
			        50: {
			            opacity: 0
			        },
			        100: {
			            opacity: 1
			        }
			        }});
		this.fadeRunning = true;
	},
	stopFading: function () {
		this.fadeRunning = false;
	},
	isFading: function () {
		var iconEl = this.getEl().down(".x-btn-inner");
		
		if (iconEl.getActiveAnimation() === false) {
			return false;
		}
		
		return true;
	}
});
Ext.define('PartKeepr.SystemNoticeButton', {
	extend: 'PartKeepr.FadingButton',
	icon: 'resources/fugue-icons/icons/service-bell.png',
	tooltip: i18n("Unacknowledged System Notices"),
	initComponent: function () {
		this.callParent();
		
		this.on("render", this.startFading, this);
		this.on("click", this.onClick, this);
	},
	onClick: function () {
		PartKeepr.getApplication().menuBar.showSystemNotices();
	}
});
Ext.define("PartKeepr.PartUnitComboBox",{
    extend:"Ext.form.field.ComboBox",
    alias: 'widget.PartUnitComboBox',
    displayField: 'name',
    valueField: 'id',
    autoSelect: true,
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    editable: true,
    initComponent: function () {
		this.store = PartKeepr.getApplication().getPartUnitStore();
		
		/* Workaround to remember the value when loading */
		this.store.on("beforeload", function () {
			this._oldValue = this.getValue();
		}, this);
		
		/* Set the old value when load is complete */
		this.store.on("load", function () {
			this.setValue(this._oldValue);
		}, this);
		
		this.callParent();
    }
});


/**
 * Represents a session against the PartKeepr Server.
 */
Ext.define("PartKeepr.SessionManager", {
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
		this.loginDialog = Ext.create("PartKeepr.LoginDialog");
		
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
		var k = new PartKeepr.ServiceCall("Auth", "login");
		k.setParameter("username", username);
		k.setParameter("password", md5(password));
		
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
		
		PartKeepr.getApplication().setAdmin(response.admin);
		PartKeepr.getApplication().setUsername(response.username);
		
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
	}
});
Ext.define('PartKeepr.CurrentStatisticsPanel', {
	extend: 'Ext.panel.Panel',
	width: 400,
	height: 250,
	title: i18n("Current Statistics"),
	bodyStyle: {
		padding: "5px"
	},
	layout: 'fit',
	/**
	 * Initializes the component and adds a template
	 */
	initComponent: function () {
		/**
		 * Create the template
		 */
		this.tpl = new Ext.XTemplate(
				'<h1>'+i18n("Current Statistics")+'</h1>',
				'<table>',
				'<tr>',
					'<td style="width: 200px;" class="o">'+i18n("Different Parts")+':</td>',
					'<td style="width: 200px;" class="o">{partCount}</td>',
				'</tr>',
				'<tr>',
					'<td style="width: 200px;" class="e">'+i18n("Total Part Value")+':</td>',
					'<td style="width: 200px;" class="e">{totalPrice}</td>',
				'</tr>',
				'<tr>',
					'<td style="width: 200px;" class="o">'+i18n("Average Part Value")+':</td>',
					'<td style="width: 200px;" class="o">{averagePrice}</td>',
				'</tr>',
				'<tr>',
					'<td style="width: 200px;" class="e">'+i18n("Parts with price")+':</td>',
					'<td style="width: 200px;" class="e">{partsWithPrice}</td>',
				'</tr>',
				'<tr>',
					'<td style="width: 200px;" class="o">'+i18n("Parts without price")+':</td>',
					'<td style="width: 200px;" class="o">{partsWithoutPrice}</td>',
				'</tr>',
				'<tr>',
					'<td class="e">'+i18n("Categories")+':</td>',
					'<td class="e">{categoryCount}</td>',
				'</tr>',
				'</table>',
				'<h1>'+i18n("Counts per Unit")+'</h1>',
				'<table>',
				'<tpl for="units">',
					'<tr>',
						'<td style="width: 200px;" class="{[xindex % 2 === 0 ? "e" : "o"]}">{name}</td>',
						'<td style="width: 200px;" class="{[xindex % 2 === 0 ? "e" : "o"]}">{stockLevel}</td>',
					'</tr>',
				'</tpl>',
				'</table>');
		
		this.tbButtons = [{
			text: i18n("Refresh"),
			handler: this.loadStats,
			scope: this
		},{
			text: i18n("Close"),
			handler: this.close,
			scope: this
		}];
		
		this.dockedItems = [{
			xtype: 'toolbar',
			dock: 'bottom',
			ui: 'footer',
			items: this.tbButtons
		}];
		
		this.view = Ext.create("Ext.panel.Panel", {
			autoScroll: true
		});
		
		this.items = this.view;
		this.callParent();
		
		this.loadStats();
	},
	loadStats: function () {
		var call = new PartKeepr.ServiceCall(
    			"Statistic", 
    			"getCurrentStats");
		
		call.setHandler(Ext.bind(this.onStatsLoaded, this));
		call.doCall();
	},
	onStatsLoaded: function (data) {
		this.tpl.overwrite(this.view.getTargetEl(), data);
	}
});
Ext.define('PartKeepr.StatisticsChartPanel', {
	extend: 'Ext.form.Panel',
    title: i18n("Statistics Chart"),

    layout: 'anchor',
    bodyStyle: 'background:#DBDBDB;padding: 15px;',
    
    initComponent: function () {
    	this.chart = Ext.create("PartKeepr.StatisticsChart", { anchor: '100% -60' });
    	
    	this.dateSelector1 = Ext.create("Ext.form.field.Date", {
    		style: 'margin-top: 10px', 
    		fieldLabel: i18n("From"),
    		listeners: {
    			change: Ext.bind(this.onDateChanged, this)
    		}
    	});
    	
    	this.dateSelector2 = Ext.create("Ext.form.field.Date", {
    		fieldLabel: i18n("To"),
    		listeners: {
    			change: Ext.bind(this.onDateChanged, this)
    		}
    	});
    	
    	this.items = [ this.chart, this.dateSelector1, this.dateSelector2 ];
    	
    	this.reloadDates();
    	
    	this.callParent();
    },
    onDateChanged: function () {
    	this.chart.setStart(this.dateSelector1.getValue());
    	this.chart.setEnd(this.dateSelector2.getValue());
    	this.chart.store.load();
    },
    reloadDates: function () {
    	var call = new PartKeepr.ServiceCall("Statistic", "getStatisticRange");
		call.setHandler(Ext.bind(this.onReloadDates, this));
		call.doCall();
    },
    onReloadDates: function (data) {
    	if (data.data.start === null || data.data.end === null) {
    		Ext.Msg.alert(
    				i18n("Unable to retrieve the statistic data"),
    				i18n("The system was unable to retrieve the statistic data. The most probable cause is that the CreateStatisticSnapshot.php cronjob is not running."));
    		return;
    	}
    	
    	var start = Ext.Date.parse(data.data.start, "Y-m-d H:i:s");
    	var end = Ext.Date.parse(data.data.end, "Y-m-d H:i:s");
    	
    	this.dateSelector1.setMinValue(start);
    	this.dateSelector1.setMaxValue(end);
    	this.dateSelector1.suspendEvents();
    	
    	this.dateSelector1.setValue(start);
    	this.dateSelector1.resumeEvents();
    	
    	
    	this.dateSelector2.setMinValue(start);
    	this.dateSelector2.setMaxValue(end);
    	
    	this.dateSelector2.suspendEvents();
    	this.dateSelector2.setValue(end);
    	this.dateSelector2.resumeEvents();
    	
    	this.chart.setStart(start);
    	this.chart.setEnd(end);
    	this.chart.store.load();
    }
});
Ext.define('PartKeepr.StatisticsChart', {
	extend: 'Ext.chart.Chart',
	animate: true,
    shadow: true,
    
    style: 'border: 1px solid #AAA;background-color: white;box-shadow: 5px 5px 0px #aaa',
    legend: {
        position: 'right'
    },
    theme: 'Base',
    series: [{
        type: 'line',
        highlight: {
            size: 7,
            radius: 7
        },
        axis: 'left',
        xField: 'start',
        yField: 'parts',
        tips: {
            trackMouse: true,
            width: 170,
            height: 28,
            renderer: function(storeItem, item) {
            	this.setTitle(Ext.Date.format(storeItem.get('start'), "Y-m-d") + ": " + storeItem.get("parts") +" " + i18n("Parts"));
            }
          },
        title: i18n("Parts"),
        markerConfig: {
            type: 'cross',
            size: 4,
            radius: 4,
            'stroke-width': 0
        }
    }, {
        type: 'line',
        highlight: {
            size: 7,
            radius: 7
        },
        tips: {
            trackMouse: true,
            width: 170,
            height: 28,
            renderer: function(storeItem, item) {
            	this.setTitle(Ext.Date.format(storeItem.get('start'), "Y-m-d") + ": " + storeItem.get("categories") +" " + i18n("Categories"));
            }
          },
        axis: 'left',
        title: i18n("Categories"),
        smooth: true,
        xField: 'start',
        yField: 'categories',
        markerConfig: {
            type: 'circle',
            size: 4,
            radius: 4,
            'stroke-width': 0
        }
    }],
    initComponent: function () {
    	
    	/**
    	 * Defines the first axis, which indicates the count.
    	 */
    	this.axis1 = {
    	        type: 'Numeric',
    	        minimum: 0,
    	        position: 'left',
    	        fields: ['parts', 'categories'],
    	        title: i18n("Count"),
    	        minorTickSteps: 1,
    	        grid: {
    	            odd: {
    	                opacity: 1,
    	                fill: '#eee',
    	                stroke: '#bbb',
    	                'stroke-width': 0.5
    	            },
    	            even: {
    	            	opacity: 1,
    	                stroke: '#bbb',
    	                'stroke-width': 0.5
    	            }
    	        }
    	    };
    	
    	/**
    	 * Defines the second axis, which indicates the time.
    	 */
    	this.axis2 = {
    	        type: 'Time',
    	        dateFormat: 'Y-m-d',
    	        position: 'bottom',
    	        aggregateOp: "avg",
    	        fields: ['start'],
    	        title: i18n("Date"),
    	        grid: true
    	    };
    	
    	this.axes = [ this.axis1, this.axis2 ];
    	
    	this.store = Ext.create("Ext.data.Store", {
    		model: 'PartKeepr.StatisticSample',
    		proxy: {
    	        type: 'ajax',
    	        reader: {
    	            type: 'json',
    	            root: 'response.data'
    	        },
    	        url : 'service.php',
    	        extraParams: {
    	        	"service": "Statistic",
    	        	"call": "getSampledStatistics",
   	        		"startDateTime": "2011-01-01 00:00:00",
       	        	"endDateTime": "2011-12-01 23:59:59"	
    	        },
    	        headers: {
    	        	session :PartKeepr.getApplication().getSession()
    	        }
    	    },
    	    autoLoad: false
    	});
    	
    	this.callParent();
    },
    /**
     * Sets the start date for the chart. Does not trigger a reload of the dataset.
     * @param date A valid date object
     */
    setStart: function (date) {
    	if (!(date instanceof Date)) { return; }
    	this.store.getProxy().extraParams.startDateTime = Ext.Date.format(date, "Y-m-d H:i:s");
    },
    /**
     * Sets the end date for the chart. Does not trigger a reload of the dataset.
     * @param date A valid date object
     */
    setEnd: function (date) {
    	if (!(date instanceof Date)) { return; }
    	
    	// Always set the end date to the end of the day
    	date.setHours(23);
    	date.setMinutes(59);
    	date.setSeconds(59);
    	
    	this.store.getProxy().extraParams.endDateTime = Ext.Date.format(date, "Y-m-d H:i:s");
    }
});
PartKeepr.CategoryTreeStore = Ext.define("CategoryTreeStore",
{
	extend: "Ext.data.TreeStore",
    model: 'PartKeepr.Category',
    proxy: {
        type: 'ajax',
        url: PartKeepr.getBasePath()+'/Category',
        method: 'POST',
        extraParams: {
        	call: 'getCategories'
        },
        reader: {
        	type: 'json',
        	root: 'response'
        }
    },
    root: {
        text: 'Ext JS',
        id: 'src',
        expanded: true
    },
    constructor: function () {
    	this.proxy.extraParams.session = PartKeepr.getSession();
    	
    	this.callParent();
    },
    folderSort: true
});
/**
 * Defines the login dialog
 */
Ext.define('PartKeepr.LoginDialog', {
	extend: 'Ext.Window',
	/* Various style settings */
	title: i18n("PartKeepr: Login"),
	
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
	    	fieldLabel: i18n("Username"),
	    	anchor: '100%'
	    });

		this.passwordField = Ext.ComponentMgr.create({
        	xtype: 'textfield',
        	inputType: "password",
        	value: "",
        	fieldLabel: i18n("Password"),
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
			       		text: i18n("Connect"),
			       		icon: 'resources/silkicons/connect.png',
			       		handler: Ext.bind(this.login, this)
			       	},{
			       		text: i18n("Close"),
			       		handler: Ext.bind(this.close, this),
			       		icon: 'resources/silkicons/cancel.png'
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
/**
 * @class PartKeepr.EditorComponent

 * <p>The EditorComponent encapsulates an editing workflow. In general, we have four actions
 * for each object: create, update, delete, view. These actions stay exactly the same for each
 * distinct object.</p>
 * <p>The EditorComponent is a border layout, which has a navigation and an editor area.</p>
 * @todo Document the editor system a bit better 
 */
Ext.define('PartKeepr.EditorComponent', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.EditorComponent',
	
	/**
	 * Misc layout settings
	 */
	layout: 'border',
	padding: 5,
	border: false,
	
	/**
	 * Specifies the class name of the navigation. The navigation is placed in the "west" region
	 * and needs to fire the event "itemSelect". The component listens on that event and
	 * creates an editor based on the selected record.
	 */
	navigationClass: null,
	
	/**
	 * Specifies the class name of the editor.
	 */
	editorClass: null,
	
	/**
	 * Contains the store for the item overview.
	 */
	store: null,
	
	/**
	 * Contains the associated model to load a record for.
	 */
	model: null,
	
	/**
	 * Some default text messages. Can be overridden by sub classes.
	 */
	deleteMessage: i18n("Do you really wish to delete the item %s?"),
	deleteTitle: i18n("Delete Item"),
	newItemText: i18n("New Item"),
	
	initComponent: function () {
		
		/**
		 * Create the navigation panel
		 */
		this.navigation = Ext.create(this.navigationClass, {
			region: 'west',
			width: 265,
			split: true,
			store: this.store
		});
		
		this.navigation.on("itemAdd", 		this.newRecord, 	this);
		this.navigation.on("itemDelete", 	this.confirmDelete, this);
		this.navigation.on("itemEdit", 		this.startEdit, 	this);
		
		/**
		 * Create the editor panel
		 */
		this.editorTabPanel = Ext.create("Ext.tab.Panel", {
			region: "center",
			layout: 'fit',
			plugins: Ext.create('Ext.ux.TabCloseMenu')
		});
		
		this.items = [ this.navigation, this.editorTabPanel ];
		
		this.callParent();
	},
	/**
	 * Creates a new record. Creates a new instance of the editor.
	 */
	newRecord: function (defaults) {
		Ext.apply(defaults, {});
		
		var editor = this.createEditor(this.newItemText);
		editor.newItem(defaults);
		this.editorTabPanel.add(editor).show();
	},
	/**
	 * Instructs the component to edit a new record.
	 * @param {Record} record The record to edit
	 */
	startEdit: function (id) {
		/* Search for an open editor for the current record. If we
		 * already have an editor, show the editor instead of loading
		 * a new record.
		 */
		var editor = this.findEditor(id);
		
		if (editor !== null) {
			editor.show();
			return;
		}
		
		// Still here? OK, we don't have an editor open. Create a new one
		var model = Ext.ModelManager.getModel(this.model);
		
		model.load(id, {
			scope: this,
		    success: function(record, operation) {
		    	editor = this.createEditor(record.getRecordName());
				editor.editItem(record);
				this.editorTabPanel.add(editor).show();
		    }
		});
	},
	findEditor: function (id) {
		for (var i=0;i<this.editorTabPanel.items.getCount();i++) {
			if (this.editorTabPanel.items.getAt(i).getRecordId() == id) {
				return this.editorTabPanel.items.getAt(i);
			}
		}
		
		return null;
	},
	createEditor: function (title) {
		var editor = Ext.create(this.editorClass, {
			store: this.store,
			title: title,
			model: this.model,
			closable: true,
			listeners: {
				editorClose: Ext.bind(function (m) {
					this.editorTabPanel.remove(m);
				}, this)
			}
		});
		
		editor.on("itemSaved", this.onItemSaved, this);
		return editor;
	},
	confirmDelete: function () {
		var r = this.navigation.getSelectionModel().getLastSelected();
		var recordName;
		
		if (r.getRecordName) {
			recordName = r.getRecordName();
		} else {
			recordName = r.get("name");
		}
		
		Ext.Msg.confirm(
				this.deleteTitle,
				sprintf(this.deleteMessage, recordName),
				function (but) {
					if (but == "yes") {
						this.deleteRecord(r);
					}
				},this);
	},
	deleteRecord: function (r) {
		var editor = this.findEditor(r.get("id"));
		
		if (editor !== null) {
			this.editorTabPanel.remove(editor);
		}
		
		r.destroy();
		this.store.load();
	},
	// Creates a store. To be called from child's initComponent
	createStore: function (config) {
		Ext.Object.merge(config, {
				autoLoad: true,
				model: this.model,
				autoSync: false, // Do not change. If true, new (empty) records would be immediately commited to the database.
				remoteFilter: true,
				remoteSort: true,
				pageSize: 15});
		
		this.store = Ext.create('Ext.data.Store', config);
		
		// Workaround for bug http://www.sencha.com/forum/showthread.php?133767-Store.sync()-does-not-update-dirty-flag&p=607093#post607093
		this.store.on('write', function(store, operation) {
	        var success=operation.wasSuccessful();
	        if (success) {
	            Ext.each(operation.records, function(record){
	                if (record.dirty) {
	                    record.commit();
	                }
	            });
	        }
		});
	},
	getStore: function () {
		return this.store;
	},
	onItemSaved: function (record) {
		this.navigation.syncChanges(record);	
	}
});
/**
 * Represents the project editor component
 */
Ext.define('PartKeepr.SystemNoticeEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.SystemNoticeEditorComponent',
	navigationClass: 'PartKeepr.SystemNoticeGrid',
	editorClass: 'PartKeepr.SystemNoticeEditor',
	newItemText: i18n("New System Notice"),
	model: 'PartKeepr.SystemNotice',
	initComponent: function () {
		this.createStore({
			sorters: [{
				proxy: PartKeepr.getRESTProxy("SystemNotice"),
				property: 'date',
				direction:'DESC'
	          }]
		});
		
		this.callParent();
	}
});
Ext.define('PartKeepr.FootprintEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.FootprintEditorComponent',
	navigationClass: 'PartKeepr.FootprintTree',
	editorClass: 'PartKeepr.FootprintEditor',
	newItemText: i18n("New Footprint"),
	model: 'PartKeepr.Footprint',
	initComponent: function () {
		this.createStore({
			proxy: PartKeepr.getRESTProxy("Footprint"),
			sorters: [{
	              property: 'name',
	              direction:'ASC'
	          }]
		});
		
		this.callParent();
		
	},
	deleteRecord: function (r) {
		var editor = this.findEditor(r.get("footprintId"));
		
		if (editor !== null) {
			this.editorTabPanel.remove(editor);
		}
		
		var call = new PartKeepr.ServiceCall("Footprint", "destroy");
		call.setParameter("id", r.get("footprintId"));
		call.setHandler(Ext.bind(function () {
			var oldRecordIndex = PartKeepr.getApplication().getFootprintStore().find("id", r.get("footprintId"));
			
			PartKeepr.getApplication().getFootprintStore().removeAt(oldRecordIndex);
			this.navigation.loadCategories();
		}, this));
		
		call.doCall();
		
		
	}
});
/**
 * Represents the project editor component
 */
Ext.define('PartKeepr.ProjectEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.ProjectEditorComponent',
	navigationClass: 'PartKeepr.ProjectGrid',
	editorClass: 'PartKeepr.ProjectEditor',
	newItemText: i18n("New Project"),
	model: 'PartKeepr.Project',
	initComponent: function () {
		this.createStore({
			sorters: [{
				proxy: PartKeepr.getRESTProxy("Project"),
				property: 'name',
				direction:'ASC'
	          }]
		});
		
		this.callParent();
	}
});
Ext.define('PartKeepr.ManufacturerEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.ManufacturerEditorComponent',
	navigationClass: 'PartKeepr.ManufacturerGrid',
	editorClass: 'PartKeepr.ManufacturerEditor',
	newItemText: i18n("New Manufacturer"),
	model: 'PartKeepr.Manufacturer',
	initComponent: function () {
		this.createStore({
			sorters: [{
				proxy: PartKeepr.getRESTProxy("Manufacurer"),
	            property: 'name',
	            direction:'ASC'
	          }]
		});
		
		this.callParent();
	}
});
Ext.define('PartKeepr.UserEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.UserEditorComponent',
	navigationClass: 'PartKeepr.UserGrid',
	editorClass: 'PartKeepr.UserEditor',
	newItemText: i18n("New User"),
	deleteMessage: i18n("Do you really wish to delete the user '%s'?"),
	deleteTitle: i18n("Delete User"),
	
	model: 'PartKeepr.User',
	
	initComponent: function () {
		this.createStore({
			sorters: [{
				proxy: PartKeepr.getRESTProxy("User"),
				property: 'username',
				direction:'ASC'
	          }]
		});
		
		this.callParent();
	}
});
Ext.define('PartKeepr.PartUnitEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.PartUnitEditorComponent',
	navigationClass: 'PartKeepr.PartUnitGrid',
	editorClass: 'PartKeepr.PartUnitEditor',
	newItemText: i18n("New Part Measurement Unit"),
	deleteMessage: i18n("Do you really wish to delete the part measurement unit'%s'?"),
	deleteTitle: i18n("Delete Part Measurement Unit"),
	model: 'PartKeepr.PartUnit',
	initComponent: function () {
		this.createStore({
			sorters: [{
				proxy: PartKeepr.getRESTProxy("PartUnit"),
				property: 'name',
				direction:'ASC'
	          }]
		});
		
		this.callParent();
	}
});
Ext.define('PartKeepr.UnitEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.UnitEditorComponent',
	navigationClass: 'PartKeepr.UnitGrid',
	editorClass: 'PartKeepr.UnitEditor',
	newItemText: i18n("New Unit"),
	deleteMessage: i18n("Do you really wish to delete the unit'%s'?"),
	deleteTitle: i18n("Delete Unit"),
	model: 'PartKeepr.Unit',
	initComponent: function () {
		this.createStore({
			sorters: [{
				proxy: PartKeepr.getRESTProxy("Unit"),
				property: 'name',
				direction:'ASC'
	          }]
		});
		
		this.callParent();
	}
});
Ext.define('PartKeepr.DistributorEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.DistributorEditorComponent',
	navigationClass: 'PartKeepr.DistributorGrid',
	editorClass: 'PartKeepr.DistributorEditor',
	newItemText: i18n("New Distributor"),
	model: 'PartKeepr.Distributor',
	initComponent: function () {
		this.createStore({
			proxy: PartKeepr.getRESTProxy("Distributor"),
			sorters: [{
	              property: 'name',
	              direction:'ASC'
	          }]
		});
		
		this.callParent();
	}
});
Ext.define('PartKeepr.StorageLocationEditorComponent', {
	extend: 'PartKeepr.EditorComponent',
	alias: 'widget.StorageLocationEditorComponent',
	navigationClass: 'PartKeepr.StorageLocationGrid',
	editorClass: 'PartKeepr.StorageLocationEditor',
	newItemText: i18n("New Storage Location"),
	model: 'PartKeepr.StorageLocation',
	initComponent: function () {
		this.createStore({
			sorters: [{
				proxy: PartKeepr.getRESTProxy("StorageLocation"),
				property: 'name',
				direction:'ASC'
	          }]
		});
		
		this.callParent();
	}
});
Ext.define('PartKeepr.Editor', {
	extend: 'Ext.form.Panel',
	alias: 'widget.Editor',
	trackResetOnLoad: true,
	bodyStyle: 'background:#DBDBDB;padding: 10px;',
	record: null,		// The record which is currently edited
	saveText: i18n("Save"),
	cancelText: i18n("Cancel"),
	model: null,
	layout: 'anchor',
	change: false,
	autoScroll: true,
    defaults: {
        anchor: '100%',
        labelWidth: 150
    },
    enableButtons: true,
    
    // If false, determinates if we should sync via the store or the record itself.
    // If true, always syncs the record via it's own proxy.
    syncDirect: false,
    
    onFieldChange: function () {
    	return;
    	
    	// @todo Finish implementing the dirty flag later
    	/*if (this.change == false) {
    		this.setTitle(this.record.getRecordName() + "*");
    	}
    	
    	this.change = true;*/
    },
	initComponent: function () {
		if (this.enableButtons) {
			this.saveButton = Ext.create("Ext.button.Button", {
				text: this.saveText,
				icon: 'resources/fugue-icons/icons/disk.png',
				handler: Ext.bind(this._onItemSave, this)
			});
			
			this.cancelButton = Ext.create("Ext.button.Button", {
				text: this.cancelText,
				icon: 'resources/silkicons/cancel.png',
				handler: Ext.bind(this.onCancelEdit, this)
			});
			
			this.bottomToolbar = Ext.create("Ext.toolbar.Toolbar", {
				enableOverflow: true,
				margin: '10px',
				defaults: {minWidth: 100},
				dock: 'bottom',
				ui: 'footer',
				items: [ this.saveButton, this.cancelButton ]
			});
			
			Ext.apply(this, {
				dockedItems: [ this.bottomToolbar ]});
		}
		
		
		
		
		this.on("dirtychange", function (form, dirty) {
			// @todo Check dirty flag
			// Waiting for reply on http://www.sencha.com/forum/showthread.php?135142-Ext.form.Basic.loadRecord-causes-form-to-be-dirty&p=607588#post607588
		});
		
		this.addEvents(
				"editorClose",
				"startEdit",
				"itemSaved", 

				/**
				 * Fired before the item is saved.
				 * 
				 * @param record The record which is about to be saved
				 */
				"itemSave");
		
		this.defaults.listeners = {
        	"change": Ext.bind(this.onFieldChange, this)
        };
		
		this.callParent();
	},
	onCancelEdit: function () {
		this.fireEvent("editorClose", this);
	},
	newItem: function (defaults) {
		Ext.apply(defaults, {});
		var j = Ext.create(this.model, defaults);
		this.editItem(j);
	},
	editItem: function (record) {
		this.record = record;
		this.getForm().loadRecord(this.record);
		this.show();
		if (this.record.getRecordName() !== "") {
			this._setTitle(this.record.getRecordName());
		}
		
		this.change = false;
		this.fireEvent("startEdit", this);
	},
	getRecordId: function () {
		if (this.record) {
			return this.record.get("id");
		} else {
			return null;
		}
	},
	_onItemSave: function () {
		// Disable the save button to indicate progress
		if (this.enableButtons) {
			this.saveButton.disable();

			// Sanity: If the save process fails, re-enable the button after 30 seconds
			Ext.defer(function () { this.saveButton.enable(); }, 30000, this);
		}
		
		this.getForm().updateRecord(this.record);
		
		this.fireEvent("itemSave", this.record);
		
		this.record.save({
				callback: this._onSave,
				scope: this
		});
	},
	_onSave: function (record, response) {
		if (this.enableButtons) {
			// Re-enable the save button
			this.saveButton.enable();
		}
		
		if (response.success === true) {
			this.record = record;
			this.fireEvent("itemSaved", this.record);			
		}
	},
	_setTitle: function (title) {
		this.setTitle(title);
	}
});

/**
 * Represents the system notice editor
 */
Ext.define('PartKeepr.SystemNoticeEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.SystemNoticeEditor',
	
	// Various style configurations
	saveText: i18n("Save System Notice"),
	defaults: {
        anchor: '100%',
        labelWidth: 110
    },
	layout: {
	    type: 'vbox',
	    align : 'stretch',
	    pack  : 'start'
	},
	enableButtons: false,
	
	/**
	 * Initializes the component
	 */
	initComponent: function () {
		
		this.acknowledgeButton = Ext.create("Ext.button.Button", {
			text: i18n("Acknowledge Notice"),
			icon: 'resources/silkicons/accept.png'
		});
		
		this.acknowledgeButton.on("click", this.onAcknowledgeClick, this);
		
		this.bottomToolbar = Ext.create("Ext.toolbar.Toolbar", {
			enableOverflow: true,
			margin: '10px',
			defaults: {minWidth: 100},
			dock: 'bottom',
			ui: 'footer',
			items: [ this.acknowledgeButton ]
		});
		
		this.dockedItems = new Array(this.bottomToolbar);
		
		this.items = [{
        	xtype: 'textfield',
        	readOnly: true,
        	name: 'title',
        	fieldLabel: i18n("Title")
		},{
        	xtype: 'textarea',
        	readOnly: true,
        	flex: 1,
        	name: 'description',
        	fieldLabel: i18n("Description")
		},{
        	xtype: 'datefield',
        	readOnly: true,
        	hideTrigger: true,
        	name: 'date',
        	fieldLabel: i18n("Date")
		}];
		
		this.callParent();
	},
	onAcknowledgeClick: function () {
		var call = new PartKeepr.ServiceCall("SystemNotice", "acknowledge");
		call.setParameter("id", this.record.get("id"));
		call.setHandler(Ext.bind(this.onAcknowledged, this));
		call.doCall();
	},
	onAcknowledged: function () {
		this.fireEvent("editorClose", this);
		this.store.load();
	}
});
Ext.define('PartKeepr.FootprintEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.FootprintEditor',
	saveText: i18n("Save Footprint"),
	layout: 'column',
	syncDirect: true,
	labelWidth: 75,
	initComponent: function () {
		this.on("startEdit", this.onEditStart, this, { delay: 50 });
		
		this.attachmentGrid = Ext.create("PartKeepr.FootprintAttachmentGrid", {
			height: 200,
			width: '100%',
			border: true
		});
		
		this.items = [{
			columnWidth: 1,
			minWidth: 500,
			layout: 'anchor',
			xtype: 'container',
			margin: '0 5 0 0',
			items: [				
							{
								xtype: 'textfield',
								name: 'name',
								labelWidth: 75,
								anchor: '100%',
								fieldLabel: i18n("Name")
							},{
								labelWidth: 75,
								xtype: 'textarea',
								name: 'description',
								anchor: '100%',
								fieldLabel: i18n("Description")
							},{
								labelWidth: 75,
								xtype: 'fieldcontainer',
								anchor: '100%',
								fieldLabel: i18n("Attachments"),
								items: this.attachmentGrid
							}
				        ]
			},{
				width: 370,
				height: 250,
				xtype: 'remoteimagefield',
				name: 'image_id',
				imageType: 'footprint',
				imageWidth: 256,
				imageHeight: 256,
				labelWidth: 75,
				fieldLabel: i18n("Image")
			}];
		
		this.on("itemSaved", this._onItemSaved, this);
		this.callParent();
	},
	_onItemSaved: function (record) {
		this.attachmentGrid.bindStore(record.attachments());
	},
	onEditStart: function () {
		var store = this.record.attachments();
		this.attachmentGrid.bindStore(store);
	}
});

/**
 * Represents the project editor view 
 */
Ext.define('PartKeepr.ProjectEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.ProjectEditor',
	
	// Various style configurations
	saveText: i18n("Save Project"),
	defaults: {
        anchor: '100%',
        labelWidth: 110
    },
	layout: {
	    type: 'vbox',
	    align : 'stretch',
	    pack  : 'start'
	},
	
	/**
	 * Initializes the component
	 */
	initComponent: function () {
		/**
		 * Due to an ExtJS issue, we need to delay the event
		 * for a bit.
		 * 
		 * @todo Fix this in a cleaner way
		 */
		this.on("startEdit", this.onEditStart, this,{
			delay: 200
		});
		
		this.on("itemSaved", this._onItemSaved, this);
		
		var config = {};
		
		// Build the initial (empty) store for the project parts
		Ext.Object.merge(config, {
			autoLoad: false,
			model: "PartKeepr.ProjectPart",
			autoSync: false, // Do not change. If true, new (empty) records would be immediately commited to the database.
			remoteFilter: false,
			remoteSort: false
			});
	
		this.store = Ext.create('Ext.data.Store', config);
	
		this.partGrid = Ext.create("PartKeepr.ProjectPartGrid", {
			store: this.store,
	        listeners: {
	        	edit: this.onProjectGridEdit
	        }
		});
		
		var container = Ext.create("Ext.form.FieldContainer", {
			fieldLabel: i18n("Project Parts"),
			labelWidth: 110,
			layout: 'fit',
			flex: 1,
			items: this.partGrid
		});
		
		this.attachmentGrid = Ext.create("PartKeepr.ProjectAttachmentGrid", {
			border: true
		});
		
		var container2 = Ext.create("Ext.form.FieldContainer", {
			fieldLabel: i18n("Attachments"),
			labelWidth: 110,
			layout: 'fit',
			flex: 1,
			items: this.attachmentGrid
		});
		
		this.items = [{
			xtype: 'textfield',
			name: 'name',
			height: 20,
			fieldLabel: i18n("Project Name")
		},{
			xtype: 'textarea',
			name: 'description',
			fieldLabel: i18n("Project Description"),
			height: 70
		},
			container,
			container2
		];
		this.callParent();
		
	},
	/**
	 * Handle transparent setting of the part name after a value was selected from the combobox
	 */
	onProjectGridEdit: function (editor, e) {
		if (e.field == "part_id") {
			/**
			 * If the user cancelled the editing, set the field to the original value
			 */
			if (e.value === null) {
				e.record.set("part_id", e.originalValue);
			}
			
			/**
			 * Inject the name into the record
			 */
			var rec = e.column.getEditor().store.getById(e.value);
			if (rec) {
				e.record.set("part_name", rec.get("name"));	
			}
		}
	},
	/**
	 * Re-bind the store after an item was saved
	 */
	_onItemSaved: function (record) {
		this.partGrid.bindStore(record.parts());
		this.attachmentGrid.bindStore(record.attachments());
	},
	/**
	 * Bind the store as soon as the view was rendered.
	 * 
	 * @todo This is a hack, because invocation of this method is delayed.
	 */
	onEditStart: function () {
		var store = this.record.parts();
		this.partGrid.bindStore(store);
		
		var store2 = this.record.attachments();
		this.attachmentGrid.bindStore(store2);
	}
});
Ext.define('PartKeepr.ManufacturerEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.ManufacturerEditor',
	saveText: i18n("Save Manufacturer"),
	labelWidth: 150,
	initComponent: function () {
		this.on("startEdit", Ext.bind(this.onEditStart, this));
		
		this.tpl = [
				'<tpl for=".">',
		            '<div class="thumb-wrap" id="{id}">',
				    '<div class="thumb"><img src="image.php?type=iclogo&id={id}&w=64&h=64&tmpId={tmp_id}"></div>',
				    '</div>',
		        '</tpl>',
		        '</tpl>',
		        '<div class="x-clear"></div>'
		        ];
		
		this.addLogoButton = Ext.create("Ext.button.Button", {
	        icon: "resources/silkicons/add.png",
	        text: i18n("Add Logo"),
	        handler: Ext.bind(this.uploadImage, this)
		});
		
		this.deleteLogoButton = Ext.create("Ext.button.Button", {
	        icon: "resources/silkicons/delete.png",
	        text: i18n("Delete Logo"),
	        disabled: true,
	        handler: Ext.bind(this.deleteImage, this)
		});
		
		this.iclogoGrid = Ext.create("Ext.view.View", {
			store: null,
			border: true,
			frame: true,
			style: 'background-color: white',
			emptyText: 'No images to display',
			height: 200,
			fieldLabel: i18n("Logos"),
			overItemCls: 'x-view-over',
			componentCls: 'manufacturer-ic-logos',
			itemSelector: 'div.thumb-wrap',
			singleSelect: true,
			anchor: '100%',
			tpl: this.tpl,
			listeners: {
				selectionchange: Ext.bind(function (view, selections) {
					if (selections.length > 0) {
						this.deleteLogoButton.enable();
					} else {
						this.deleteLogoButton.disable();
					}
				}, this) 
					//this.onLogoSelectionChange.createDelegate(this)
			}
		});
		
		this.items = [{
			xtype: 'textfield',
			name: 'name',
			fieldLabel: i18n("Manufacturer Name")
		},{
			xtype: 'textarea',
			name: 'address',
			fieldLabel: i18n("Address")
		},{
			xtype: 'textfield',
			name: 'url',
			fieldLabel: i18n("Website")
		},{
			xtype: 'textfield',
			name: 'email',
			fieldLabel: i18n("Email")
		},{
			xtype: 'textfield',
			name: 'phone',
			fieldLabel: i18n("Phone")
		},{
			xtype: 'textfield',
			name: 'fax',
			fieldLabel: i18n("Fax")
		},{
			xtype: 'textarea',
			name: 'comment',
			fieldLabel: i18n("Comment")
		},{
			xtype: 'fieldcontainer',
			fieldLabel: i18n("Manufacturer Logos"),
			items: [{
				xtype: 'panel',
				dockedItems: [{
					xtype: 'toolbar',
					dock: 'bottom',
					items: [ this.addLogoButton, this.deleteLogoButton ]
					}],
				items: this.iclogoGrid
			}]
			
		}];
		
		
		this.on("itemSaved", this._onItemSaved, this);
		this.callParent();
		
	},
	_onItemSaved: function (record) {
		this.iclogoGrid.bindStore(record.iclogos());
	},
	onFileUploaded: function (response) {
		this.iclogoGrid.getStore().add({
			id: "TMP:"+response.id,
			manufacturer_id: this.record.get("id") 
		});
	},
	uploadImage: function () {
		var j = Ext.create("PartKeepr.FileUploadDialog", { imageUpload: true });
		j.on("fileUploaded", Ext.bind(this.onFileUploaded, this));
		j.show();
	},
	deleteImage: function () {
		this.iclogoGrid.store.remove(this.iclogoGrid.getSelectionModel().getLastSelected());
	},
	onEditStart: function () {
		var store = this.record.iclogos();
		this.iclogoGrid.bindStore(store);
	}
});
Ext.define('PartKeepr.UserEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.UserEditor',
	
	saveText: i18n("Save User"),
	model: 'PartKeepr.User',
	
	initComponent: function () {
		this.gridPanel = Ext.create("PartKeepr.UserPreferenceGrid");
		
		var container = Ext.create("Ext.form.FieldContainer", {
			fieldLabel: i18n("User Preferences"),
			labelWidth: 150,
			layout: 'fit',
			height: 200,
			items: this.gridPanel
		});
		
		this.items = [{
			xtype: 'textfield',
			name: 'username',
			fieldLabel: i18n("User")
		},{
			xtype: 'textfield',
			inputType: "password",
			name: 'password',
			fieldLabel: i18n("Password")
		}, container ];
		
		this.on("startEdit", this.onStartEdit, this);
		this.callParent();
	},
	onStartEdit: function () {
		this.gridPanel.store.getProxy().extraParams.user_id = this.record.get("id");
		this.gridPanel.store.load();
	},
	onItemSave: function () {
		this.gridPanel.syncPreferences();
		
		this.callParent();
	}
});

Ext.define('PartKeepr.PartUnitEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.PartUnitEditor',
	items: [{
		xtype: 'textfield',
		name: 'name',
		fieldLabel: i18n("Measurement Unit Name")
	},{
		xtype: 'textfield',
		name: 'shortName',
		fieldLabel: i18n("Short Name")
	}],
	saveText: i18n("Save Part Measurement Unit")
});

Ext.define('PartKeepr.UnitEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.UnitEditor',
	saveText: i18n("Save Unit"),
	initComponent: function () {
		
		var sm = Ext.create('Ext.selection.CheckboxModel',{
			checkOnly: true
		});
		
		this.gridPanel = Ext.create("PartKeepr.BaseGrid", {
			store: PartKeepr.getApplication().getSiPrefixStore(),
			selModel: sm,
			columnLines: true,
			columns: [
			          { text: i18n("Prefix"), dataIndex: "prefix", width: 60 },
			          { text: i18n("Symbol"), dataIndex: "symbol", width: 60 },
			          { text: i18n("Power"), dataIndex: "power", flex: 1, renderer: function (val) { return "10<sup>"+val+"</sup>"; } }
			          ]
		});

		var container = Ext.create("Ext.form.FieldContainer", {
			fieldLabel: i18n("Allowed SI-Prefixes"),
			labelWidth: 150,
			items: this.gridPanel
		});
		
		this.items = [{
				xtype: 'textfield',
				name: 'name',
				fieldLabel: i18n("Unit Name")
			},{
				xtype: 'textfield',
				name: 'symbol',
				fieldLabel: i18n("Symbol")
			},
			container];
		
		this.callParent();
		
		this.on("startEdit", this.onStartEdit, this);
	},
	onStartEdit: function () {
		var records = this.record.prefixes().getRange();
		
		var toSelect = [];
		var pfxStore = PartKeepr.getApplication().getSiPrefixStore();
		
		for (var i=0;i<records.length;i++) {
			toSelect.push(pfxStore.getAt(pfxStore.find("id", records[i].get("id"))));
		}
		
		// @todo I don't like defer too much, can we fix that somehow?
		Ext.defer(function () { this.gridPanel.getSelectionModel().select(toSelect); }, 100, this);
	},
	onItemSave: function () {
		var selection = this.gridPanel.getSelectionModel().getSelection();
		
		this.record.prefixes().removeAll(true);
		
		for (var i=0;i<selection.length;i++) {
			this.record.prefixes().add({id: selection[i].get("id") });
		}
		
		this.callParent();
	}
});

Ext.define('PartKeepr.DistributorEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.DistributorEditor',
	items: [{
		xtype: 'textfield',
		name: 'name',
		fieldLabel: i18n("Distributor")
	},{
		xtype: 'textarea',
		name: 'address',
		fieldLabel: i18n("Address")
	},{
		xtype: 'textfield',
		name: 'url',
		fieldLabel: i18n("Website")
	},{
		xtype: 'textfield',
		name: 'email',
		fieldLabel: i18n("Email")
	},{
		xtype: 'textfield',
		name: 'phone',
		fieldLabel: i18n("Phone")
	},{
		xtype: 'textfield',
		name: 'fax',
		fieldLabel: i18n("Fax")
	},{
		xtype: 'textarea',
		name: 'comment',
		fieldLabel: i18n("Comment")
	}],
	saveText: i18n("Save Distributor")
});

Ext.define('PartKeepr.StorageLocationEditor', {
	extend: 'PartKeepr.Editor',
	alias: 'widget.StorageLocationEditor',
	saveText: i18n("Save Storage Location"),
	
	layout: 'column',
	
	initComponent: function () {
		var config = {};
		
		Ext.Object.merge(config, {
			autoLoad: false,
			model: "PartKeepr.Part",
			autoSync: false, // Do not change. If true, new (empty) records would be immediately commited to the database.
			remoteFilter: true,
			remoteSort: true,
			proxy: PartKeepr.getRESTProxy("Part"),
			pageSize: 15});
	
		this.store = Ext.create('Ext.data.Store', config);
	
		this.gridPanel = Ext.create("PartKeepr.BaseGrid", {
			store: this.store,
			columnLines: true,
			columns: [
			           {
		        	  header: i18n("Name"),
		        	  dataIndex: 'name',
		        	  flex: 1,
		        	  minWidth: 200,
		        	  renderer: Ext.util.Format.htmlEncode
		          },{
		        	  header: i18n("Qty"),
		        	  width: 50,
		        	  dataIndex: 'stockLevel'
		          }
			          ]
		});
		
		var container = Ext.create("Ext.form.FieldContainer", {
			fieldLabel: i18n("Contained Parts"),
			labelWidth: 110,
			layout: 'fit',
			height: 246,
			items: this.gridPanel
		});
		
		
		
		this.items =  [{
			columnWidth: 1,
   			minWidth: 500,
   			layout: 'anchor',
			xtype: 'container',
			margin: '0 5 0 0',
			items: [{
			        	xtype: 'textfield',
			        	name: 'name',
			        	labelWidth: 110,
			        	fieldLabel: i18n("Storage Location")
					},
					container
					]},
					{
						width: 370,
						height: 250,
						xtype: 'remoteimagefield',
						name: 'image_id',
						imageType: 'storagelocation',
						imageWidth: 256,
						imageHeight: 256,
						labelWidth: 110,
						fieldLabel: i18n("Image")
					}];
		
		this.on("startEdit", this.onStartEdit, this);
		this.callParent();
	},
	onStartEdit: function () {
		this.store.getProxy().extraParams.storageLocation = this.record.get("name");
		this.store.load();
	}
	
});
/**
 * @class PartKeepr.PartEditor

 * <p>The PartEditor provides an editing form for a part. It contains multiple tabs, one for each nested record.</p>
 */
Ext.define('PartKeepr.PartEditor', {
	extend: 'PartKeepr.Editor',
	
	// Assigned model
	model: 'PartKeepr.Part',
	
	// Layout stuff
	border: false,
	layout: 'fit',
	bodyStyle: 'background:#DBDBDB;',
	
	/**
	 * Initializes the editor fields
	 */
	initComponent: function () {
		
		this.nameField = Ext.create("Ext.form.field.Text", {
			name: 'name',
			fieldLabel: i18n("Name"),
			allowBlank: false,
			labelWidth: 150
		});
		
		this.storageLocationComboBox = Ext.create("PartKeepr.StorageLocationComboBox",
			{
				fieldLabel: i18n("Storage Location"),
				name: 'storageLocation',
				allowBlank: false,
				labelWidth: 150
			});
		
		this.storageLocationComboBox.store.on("load", function () {
			// Re-trigger validation because of asynchronous loading of the storage location field,
			// which would be marked invalid because validation happens immediately, but after loading
			// the storage locations, the field is valid, but not re-validated.
			
			// This workaround is done twice; once after the store is loaded and once when we start editing,
			// because we don't know which event will come first
			this.getForm().isValid();
		}, this);
		
		// Defines the basic editor fields
		var basicEditorFields = [
			this.nameField,
			{
				layout: 'column',
				bodyStyle: 'background:#DBDBDB',
				border: false,
				items: [{
						xtype: 'numberfield',
						fieldLabel: i18n('Minimum Stock'),
						allowDecimals: false,
						allowBlank: false,
						labelWidth: 150,
						name: 'minStockLevel',
						value: 0,
						columnWidth: 0.5,
						minValue: 0
					},{
						xtype: 'PartUnitComboBox',
						fieldLabel: i18n("Part Unit"),
						columnWidth: 0.5,
						margin: "0 0 0 5",
						name: 'partUnit',
						value: PartKeepr.getApplication().getDefaultPartUnit().get("id")
					}]
			},{
				xtype: 'CategoryComboBox',
				fieldLabel: i18n("Category"),
				name: 'category'
			},
			this.storageLocationComboBox,
			{
				xtype: 'FootprintComboBox',
				fieldLabel: i18n("Footprint"),
				name: 'footprint'
			},{
				xtype: 'textarea',
				fieldLabel: i18n("Comment"),
				name: 'comment'
			},{
				xtype: 'textfield',
				fieldLabel: i18n("Status"),
				name: 'status'
			},{
				xtype: 'checkbox',
				hideEmptyLabel: false,
				fieldLabel: '',
				boxLabel: i18n("Needs Review"),
				name: 'needsReview'
			}];
		
		// Creates the distributor grid
		this.partDistributorGrid = Ext.create("PartKeepr.PartDistributorGrid", {
			title: i18n("Distributors"),
			iconCls: 'icon-lorry',
			layout: 'fit'
		});
		
		// Creates the manufacturer grid
		this.partManufacturerGrid = Ext.create("PartKeepr.PartManufacturerGrid", {
			title: i18n("Manufacturers"),
			iconCls: 'icon-building',
			layout: 'fit'
		});
		
		// Creates the parameter grid
		this.partParameterGrid = Ext.create("PartKeepr.PartParameterGrid", {
			title: i18n("Parameters"),
			iconCls: 'icon-table',
			layout: 'fit'
		});
		
		// Creates the attachment grid
		this.partAttachmentGrid = Ext.create("PartKeepr.PartAttachmentGrid", {
			title: i18n("Attachments"),
			iconCls: 'icon-attach',
			layout: 'fit'
		});
		
		// Adds stock level fields for new items
		if (this.partMode && this.partMode == "create") {
			this.initialStockLevel = Ext.create("Ext.form.field.Number", {
				fieldLabel: i18n("Initial Stock Level"),
				name: "initialStockLevel",
				labelWidth: 150,
				columnWidth: 0.5
			});
			
			this.initialStockLevelUser = Ext.create("PartKeepr.UserComboBox", {
				fieldLabel: i18n("Stock User"),
				name: 'initialStockLevelUser',
				columnWidth: 0.5,
				margin: "0 0 0 5"
			});
			
			basicEditorFields.push({
				layout: 'column',
				bodyStyle: 'background:#DBDBDB',
				border: false,
				items: [
				        this.initialStockLevel,
				        this.initialStockLevelUser
				]
			});
			
			this.initialStockLevelPrice = Ext.create("Ext.form.field.Number", {
				fieldLabel: i18n('Price'),
				labelWidth: 150,
				columnWidth: 0.5,
				name: 'initialStockLevelPrice'
			});
			
			this.initialStockLevelPricePerItem = Ext.create("Ext.form.field.Checkbox", {
				boxLabel: i18n("Per Item"),
				columnWidth: 0.5,
				margin: "0 0 0 5",
				name: 'initialStockLevelPricePerItem'
			});
			
			basicEditorFields.push({
				layout: 'column',
				bodyStyle: 'background:#DBDBDB',
				border: false,
				items: [
				        this.initialStockLevelPrice,
				        this.initialStockLevelPricePerItem
				]
			});
			
			
		}
		
		// Create a tab panel of all fields
		this.items = {
				xtype: 'tabpanel',
				border: false,
				plain: true,
				items: [{
					iconCls: 'icon-brick',
					xtype: 'panel',
					border: false,
					autoScroll: true,
					layout: 'anchor',
					defaults: {
				        anchor: '100%',
				        labelWidth: 150
				    },
					bodyStyle: 'background:#DBDBDB;padding: 10px;',
					title: i18n("Basic Data"),
					items: basicEditorFields
				},
				this.partDistributorGrid,
				this.partManufacturerGrid,
				this.partParameterGrid,
				this.partAttachmentGrid
				]
		};
		
		this.on("startEdit", this.onEditStart, this, { delay: 200 });
		this.on("itemSaved", this._onItemSaved, this);
		
		this.addEvents("partSaved", "titleChange");
		
		this.callParent();
		
		this.on("itemSave", this.onItemSave, this);
		
	},
	/**
	 * Cleans up the record prior saving.
	 */
	onItemSave: function () {
		var removeRecords = [], j;
		
		/**
		 * Iterate through all records and check if a valid distributor
		 * ID is assigned. If not, the record is removed as it is assumed
		 * that the record is invalid and being removed.
		 */
		for (j=0;j<this.record.distributors().getCount();j++) {
			if (this.record.distributors().getAt(j).get("distributor_id") === 0) {
				removeRecords.push(this.record.distributors().getAt(j));
			}
		}
		
		if (removeRecords.length > 0) {
			this.record.distributors().remove(removeRecords);
		}
		
		removeRecords = [];
		
		/**
		 * Iterate through all records and check if a valid parameter
		 * ID is assigned. If not, the record is removed as it is assumed
		 * that the record is invalid and being removed.
		 */

		for (j=0;j<this.record.parameters().getCount();j++) {
			if (this.record.parameters().getAt(j).get("unit_id") === 0) {
				removeRecords.push(this.record.parameters().getAt(j));
			}
		}
		
		if (removeRecords.length > 0) {
			this.record.parameters().remove(removeRecords);
		}
		
		removeRecords = [];
		
		/**
		 * Iterate through all records and check if a valid manufacturer
		 * ID is assigned. If not, the record is removed as it is assumed
		 * that the record is invalid and being removed.
		 */

		for (j=0;j<this.record.manufacturers().getCount();j++) {
			if (this.record.manufacturers().getAt(j).get("manufacturer_id") === 0) {
				removeRecords.push(this.record.manufacturers().getAt(j));
			}
		}
		
		if (removeRecords.length > 0) {
			this.record.manufacturers().remove(removeRecords);
		}
		
		/**
		 * Check if the storage location is valid. If not, try an exact, case-insensitive match for the
		 * storage location name and inject that into the record.
		 */
		if (isNaN(this.record.get("storageLocation"))) {
			var storageLocationRecord = this.storageLocationComboBox.getStore().findRecord(
					"name",
					this.storageLocationComboBox.getValue(),
					0, false, false, true)	;
			
			this.record.set("storageLocation", storageLocationRecord.get("id"));
		}
		
	},
	onEditStart: function () {
		this.bindChildStores();
		this.nameField.focus();
		
		// Re-trigger validation because of asynchronous loading of the storage location field,
		// which would be marked invalid because validation happens immediately, but after loading
		// the storage locations, the field is valid, but not re-validated.
		
		// This workaround is done twice; once after the store is loaded and once when we start editing,
		// because we don't know which event will come first
		this.getForm().isValid();
	},
	_onItemSaved: function () {
		this.fireEvent("partSaved", this.record);
		
		if (this.keepOpenCheckbox.getValue() !== true) {
			this.fireEvent("editorClose", this);
		} else {
			var newItem = Ext.create("PartKeepr.Part", this.partDefaults);
			this.editItem(newItem);
		}
	},
	bindChildStores: function () {
		this.partDistributorGrid.bindStore(this.record.distributors());
		this.partManufacturerGrid.bindStore(this.record.manufacturers());
		this.partParameterGrid.bindStore(this.record.parameters());
		this.partAttachmentGrid.bindStore(this.record.attachments());
	},
	_setTitle: function (title) {
		var tmpTitle;
		
		if (this.record.phantom) {
			tmpTitle = i18n("Add Part");
		} else {
			tmpTitle = i18n("Edit Part");	
		}
		
		if (title !== "") {
			 tmpTitle = tmpTitle + ": " + title;
		}
		
		this.fireEvent("titleChange", tmpTitle);
	}
});

Ext.define('PartKeepr.TimeDisplay', {
	extend: 'Ext.Toolbar.TextItem',
	el: null,
	dt: null,
    enable:Ext.emptyFn,
    disable:Ext.emptyFn,
    focus:Ext.emptyFn,
    constructor: function () {
    	var s = document.createElement("span");
        s.className = "ytb-text";
        var dt = new Date();
        s.innerHTML = Ext.Date.format(dt, Ext.getDateFormat());
        
        Ext.defer(this.onUpdate, 240, this);
        this.el = s;
        
    	this.callParent(arguments);
    },
    onUpdate: function (obj) {
		var dt = new Date();
		this.setText(Ext.Date.format(dt, Ext.getDateFormat())); 
    	delete dt;
    	/* Sometimes the time display seems to be "stuck" (=skipping one second)
    	 * because of micro-delays due to the "overhead" of calling this method.
    	 */
    	Ext.defer(this.onUpdate, 240, this);
	}
});


Ext.define('PartKeepr.MenuBar', {
	extend: 'Ext.toolbar.Toolbar',
	initComponent: function () {
		this.ui = "mainmenu";
		
		// @todo this is an ugly list of configurations. Refactor this in a cleaner way.
		
		this.editMenu = Ext.create('Ext.menu.Menu', {
			items: [{
						text: i18n('Projects'),
						icon: 'resources/fugue-icons/icons/drill.png',
						handler: this.editProjects
					},
			        {
			        	text: i18n('Footprints'),
			        	icon: 'resources/fugue-icons/icons/fingerprint.png',
			        	handler: this.editFootprints
			        },{
			        	text: i18n('Manufacturers'),
			        	icon: 'resources/silkicons/building.png',
			        	handler: this.editManufacturers
			        },{
			        	text: i18n('Storage Locations'),
			        	icon: 'resources/fugue-icons/icons/wooden-box.png',
			        	handler: this.editStorageLocations
			        },{
			        	text: i18n('Distributors'),
			        	icon: 'resources/silkicons/lorry.png',
			        	handler: this.editDistributors
			        },{
			        	text: i18n('Users'),
			        	id: 'edit-users',
			        	handler: this.editUsers,
			        	icon: "resources/silkicons/user.png"
			        },{
			        	text: i18n('Part Measure Units'),
			        	handler: this.editPartUnits,
			        	icon: "resources/fugue-icons/icons/ruler.png"
			        },{
			        	text: i18n("Units"),
			        	handler: this.editUnits,
			        	icon: 'resources/icons/unit.png'
			        }]
		});
		
		this.viewMenu = Ext.create('Ext.menu.Menu', {
			items: [{
			        	text: i18n("Statistics"),
			        	icon: 'resources/silkicons/chart_bar.png',
			        	menu: [
							{
								text: i18n("Summary"),
								handler: this.showStatisticsSummary,
								icon: 'resources/silkicons/chart_bar.png'
							},{
								text: i18n("Chart"),
								handler: this.showStatisticsChart,
								icon: 'resources/silkicons/chart_bar.png'
							}]
			        },
					{
						text: i18n("System Information"),
						handler: this.showSystemInformation,
						icon: 'resources/fugue-icons/icons/system-monitor.png'
					},{
						text: i18n("Project Reports"),
						handler: this.showProjectReports,
						icon: 'resources/fugue-icons/icons/drill.png'
					},{
						text: i18n("System Notices"),
						handler: this.showSystemNotices,
						icon: 'resources/fugue-icons/icons/service-bell.png'
					},{
						text: i18n("Stock History"),
						handler: this.showStockHistory,
						icon: 'resources/fugue-icons/icons/notebook.png'
					}
					
			        ]
		});
		
		this.systemMenu = Ext.create('Ext.menu.Menu', {
			items: [
			{
	        	text: i18n('Disconnect'),
	        	icon: 'resources/silkicons/disconnect.png',
	        	handler: this.disconnect
	        },{
	        	text: i18n("User Preferences"),
	        	icon: 'resources/fugue-icons/icons/gear.png',
	        	handler: this.showUserPreferences
	        }
			]
		});
		
		this.items = [{
			text: i18n("System"),
			menu: this.systemMenu
		},{
			text: i18n('Edit'),
			menu: this.editMenu 
		},{
			text: i18n('View'),
			menu: this.viewMenu 
		},
		'->',
		{
			xtype: 'tbtext',
			cls: 'partkeepr-logo-align',
			text: '<div class="partkeepr-logo">PartKeepr</div>',
			width: 200
		}];
		
		
		
		this.callParent();
	},
	showUserPreferences: function () {
		var j = new PartKeepr.UserPreferencePanel({
			iconCls: 'icon-gear',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	disconnect: function () {
		PartKeepr.getApplication().logout();
	},
	/**
	 * Shows the system information window
	 */
	showSystemInformation: function () {
		var j = Ext.create("PartKeepr.SystemInformationGrid", {
			title: i18n("System Information"),
			iconCls: 'icon-system-monitor',
			closable: true,
			padding: "5 5 5 5"
		});
		
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showStatisticsSummary: function () {
		var j = Ext.create("PartKeepr.CurrentStatisticsPanel", {
			iconCls: 'icon-chart-bar',
			closable: true
		});
		
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showStatisticsChart: function () {
		var j = Ext.create("PartKeepr.StatisticsChartPanel", {
			iconCls: 'icon-chart-bar',
			closable: true
		});
		
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editStorageLocations: function () {
		var j = Ext.create("PartKeepr.StorageLocationEditorComponent", {
			title: i18n("Storage Locations"),
			iconCls: 'icon-wooden-box',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editUnits: function () {
		var j = Ext.create("PartKeepr.UnitEditorComponent", {
			title: i18n("Units"),
			iconCls: 'icon-unit',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editManufacturers: function () {
		var j = Ext.create("PartKeepr.ManufacturerEditorComponent", {
			title: i18n("Manufacturers"),
			iconCls: 'icon-building',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editFootprints: function () {
		var j = Ext.create("PartKeepr.FootprintEditorComponent", {
			title: i18n("Footprints"),
			iconCls: 'icon-footprint',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editDistributors: function () {
		var j = Ext.create("PartKeepr.DistributorEditorComponent", {
			title: i18n("Distributors"),
			iconCls: 'icon-lorry',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editUsers: function () {
		var j = Ext.create("PartKeepr.UserEditorComponent", {
			title: i18n("Users"),
			iconCls: 'icon-user',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editPartUnits: function () {
		var j = Ext.create("PartKeepr.PartUnitEditorComponent", {
			title: i18n("Part Measurement Units"),
			iconCls: 'icon-ruler',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	editProjects: function () {
		var j = Ext.create("PartKeepr.ProjectEditorComponent", {
			title: i18n("Projects"),
			iconCls: 'icon-drill',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showProjectReports: function () {
		var j = Ext.create("PartKeepr.ProjectReportView", {
			title: i18n("Project Reports"),
			iconCls: 'icon-drill',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showSystemNotices: function () {
		var j = Ext.create("PartKeepr.SystemNoticeEditorComponent", {
			title: i18n("System Notices"),
			iconCls: 'icon-service-bell',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	showStockHistory: function () {
		var j = Ext.create("PartKeepr.StockHistoryGrid", {
			title: i18n("Stock History"),
			iconCls: 'icon-notebook',
			closable: true
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	},
	displayComponent: function (component) {
		var j = Ext.create(component.type, {
			title: component.title,
			iconCls: component.iconCls,
			closable: component.closable 
		});
		
		PartKeepr.getApplication().addItem(j);
		j.show();
	}
});
	
/**
 * Represents the multi create window.
 * @class PartKeepr.StorageLocationMultiCreateWindow
 */
Ext.define("PartKeepr.StorageLocationMultiCreateWindow", {
	extend: 'Ext.Window',
	
	// Layout stuff
	layout: 'fit',
	width: 500,
	height: 250,
	
	// Title
	title: i18n("Multi-Create Storage Locations"),
	
	/**
	 * Initializes the window by adding the buttons and the form
	 */
	initComponent: function () {
		this.form = Ext.create("PartKeepr.StorageLocationMultiAddDialog");
		
		this.items = [ this.form ];
		
		// Creates the add button as instance, so we can disable it easily.
		this.addButton = Ext.create("Ext.button.Button", {
       		text: i18n("Create Storage Locations"),
       		icon: 'resources/silkicons/add.png',
       		handler: this.onAddClick,
       		scope: this
		});
		
		this.dockedItems = [{
			xtype: 'toolbar',
			defaults: {minWidth: 100},
			dock: 'bottom',
			ui: 'footer',
			pack: 'start',
			items: [this.addButton,
	       	{
	       		text: i18n("Close"),
	       		handler: this.onCloseClick,
	       		scope: this,
	       		icon: 'resources/silkicons/cancel.png'
	       	}]
		}];
		
		this.callParent();
	},
	/**
	 * Called when the "Add" button was clicked. Sends a call to the server
	 * to create the storage locations
	 */
	onAddClick: function () {
		this.addButton.disable();
		var call = new PartKeepr.ServiceCall("StorageLocation", "massCreate");
		call.setParameter("storageLocations", this.form.getStorageLocations());
		call.setHandler(Ext.bind(this.onAdded, this));
		call.doCall();
		
	},
	/**
	 * Called when the service call was completed. Displays an error dialog
	 * if something went wrong.
	 * @param response The server response
	 */
	onAdded: function (response) {
		this.addButton.enable();
		
		
		if (response.data.length > 0) {
			Ext.Msg.alert(i18n("Errors occured"), implode("<br>", response.data));
		} else {
			this.close();
		}
	},
	/**
	 * Close the dialog
	 */
	onCloseClick: function () {
		this.close();
	}
	
});
/**
 * Represents a form which is used to create multiple storage locations at once.
 * @class PartKeepr.StorageLocationMultiAddDialog
 */
Ext.define('PartKeepr.StorageLocationMultiAddDialog', {
	extend: 'Ext.form.Panel',
	
	// Layout settings
	layout: 'anchor',
	defaults: {
		anchor: '100%'
	},
	
	// Styling
	border: false,
	bodyStyle: 'background:#DBDBDB;padding: 10px;',
	
	/**
	 * Initializes the component. Adds all form fields
	 */
	initComponent: function () {
		
		/**
		 * The prefix represents the first part of the storage location name,
		 * e.g. "A" for storage locations "A0001".
		 */
		this.storageLocationPrefix = Ext.create("Ext.form.field.Text", {
			fieldLabel: i18n("Name Prefix"),
			listeners: {
				change: {
					fn: this.onFormChange,
					scope: this
				}
			}
		});
		
		/**
		 * Specifies the start of the numeric range.
		 */
		this.storageLocationStart = Ext.create("Ext.form.field.Number", {
			fieldLabel: i18n("Start"),
			value: 1,
			minValue: 0,
			columnWidth: 0.5,
			listeners: {
				change: {
					fn: this.onFormChange,
					scope: this
				}
			}
		});
		
		/**
		 * Specifies the end of the numeric range.
		 */
		this.storageLocationEnd = Ext.create("Ext.form.field.Number", {
			fieldLabel: i18n("End"),
			value: 10,
			minValue: 1,
			columnWidth: 0.5,
			margin: "0 0 0 5",
			listeners: {
				change: {
					fn: this.onFormChange,
					scope: this
				}
			}
		});
		
		/**
		 * Specifies if the storage locations should be prefixed with a zero (e.g. creates A0001 instead of A1).
		 */
		this.storageLocationZeroPrefix = Ext.create("Ext.form.field.Checkbox", {
			boxLabel: i18n("Prefix with zeroes"),
			hideEmptyLabel: false,
			columnWidth: 0.5,
			listeners: {
				change: {
					fn: this.onFormChange,
					scope: this
				}
			}
		});
		
		/**
		 * Specifies the overall length of the storage location name. If you have a prefix "A" and numbers up to
		 * 100, you can set the overall length to 5 to achieve "A0100", or to 6 to achieve "A00100".
		 */
		this.storageLocationOverallLength = Ext.create("Ext.form.field.Number", {
			fieldLabel: i18n("Length"),
			columnWidth: 0.5,
			margin: "0 0 0 5",
			disabled: true,
			listeners: {
				change: {
					fn: this.onFormChange,
					scope: this
				}
			}
		});
		
		/**
		 * Creates a field which displays the storage locations to be created.
		 */
		this.outputField = Ext.create("Ext.form.field.TextArea", {
			fieldLabel: i18n("Sample"),
			readOnly: true,
			anchor: '100% -70'
		});
		
		this.items = [
		              this.storageLocationPrefix,
		              {
		            	layout: 'column',
		            	border: false,
		            	bodyStyle: 'background:#DBDBDB;',
		            	items: [
		            	        	this.storageLocationStart,
		            	        	this.storageLocationEnd
		            	        ]
		              },
		              {
		            	layout: 'column',
		            	border: false,
		            	plain: true,
		            	bodyStyle: 'background:#DBDBDB;',
		            	items: [
		            	        	this.storageLocationZeroPrefix,
		            	        	this.storageLocationOverallLength
		            	        ]
			          },
		              this.outputField
		              ];
		
		this.callParent();
		
		this.recalculateDemo();
	},
	/**
	 * Called when something in the form has changed.
	 */
	onFormChange: function () {
		/**
		 * If the overall length is less than the prefix plus the length of the highest number, update it
		 */
		if (this.storageLocationOverallLength.getValue() < this.getMinLength()) {
			this.storageLocationOverallLength.setValue(this.getMinLength());
		} 
		
		/**
		 * Make sure that the end value is bigger than the start value.
		 */
		if (this.storageLocationStart.getValue() > this.storageLocationEnd.getValue()) {
			this.storageLocationEnd.setValue(this.storageLocationStart.getValue());
		}
		
		/**
		 * Enable/Disable the length field if zero prefix is wanted
		 */
		if (this.storageLocationZeroPrefix.getValue()) {
			this.storageLocationOverallLength.enable();
		} else {
			this.storageLocationOverallLength.disable();
		}
		
		this.recalculateDemo();
	},
	/**
	 * Calculates the minimum length possible
	 * @returns int The minimum length possible
	 */
	getMinLength: function () {
		return 	strlen(this.storageLocationPrefix.getValue()) +
				strlen((this.storageLocationEnd.getValue()).toString());
	},
	/**
	 * Updates the sample field
	 */
	recalculateDemo: function () {
		this.outputField.setValue(implode("\n", this.getStorageLocations()));
	},
	/**
	 * Returns all storage locations which are to be created
	 * @returns {Array} The storage locations
	 */
	getStorageLocations: function () {
		var j = [];
		
		for (var i=this.storageLocationStart.getValue();i<this.storageLocationEnd.getValue()+1;i++) {
			if (!this.storageLocationZeroPrefix.getValue()) {
				// No padding wanted
				j.push(this.storageLocationPrefix.getValue()+i);
			} else {
				var padLength = this.storageLocationOverallLength.getValue() -
								( strlen(this.storageLocationPrefix.getValue()) +
								  strlen(i));
				
				j.push(this.storageLocationPrefix.getValue() + str_repeat("0", padLength)+ i);
			}
			
		}
		
		return j;
	}
	
});
Ext.define("PartKeepr.CategoryTree", {
	alias: 'widget.CategoryTree',
	extend: 'Ext.tree.Panel',
	categoryService: null,
	categoryModel: null,
	displayField: 'name',
	sorters: [{
        property: 'name',
        direction: 'ASC'
    }],
    viewConfig: {
    	animate: false
    },
    loaded: false,
    rootVisible: false,
	initComponent: function () {
		this.store = new Ext.data.TreeStore({
			root: {
				id: "src",
				name: "Foo"
			},
			remoteSort: false,
			folderSort: true
		});
		
		this.callParent();
		
		this.addEvents("categoriesLoaded");
		
		this.loadCategories();
	},
	loadCategories: function () {
		var call = new PartKeepr.ServiceCall(this.categoryService, "getAllCategories");
		call.setLoadMessage(i18n("Loading categories..."));
		call.setHandler(Ext.bind(this._onCategoriesLoaded, this));
		call.doCall();
	},
	_onCategoriesLoaded: function (result) {
		/* Store expand/collapse state for all nodes */
		var expandedNodes = this.getExpandedNodes(this.getRootNode());
		
		this.getRootNode().removeAll();
		
		this.buildCategoryTree(this.getRootNode(), result, expandedNodes);
		
		this.loaded = true;
		
		this.getRootNode().expandChildren();
		
		this.getStore().sort("name", "ASC");
		
		this.fireEvent("categoriesLoaded");
	},
	getExpandedNodes: function (node) {
		var ret = [];
		if (node.get("expanded") === true) {
			ret.push(node.get("id"));
		}
		
		for (var i=0;i<node.childNodes.length;i++) {
			ret = ret.concat(this.getExpandedNodes(node.childNodes[i]));
		}
		return ret;
	},
	buildCategoryTree : function(root, data, expandedNodes) {
		var nodeData = {
			id :  data.id,
			name : data.name,
			tooltip : data.description
		};
		
		if (Ext.Array.contains(expandedNodes, data.id)) {
			Ext.apply(nodeData, {
				expanded: true
			});
		}
		
		// Hack to prevent our virtual root node from being dragged
		if (data.id == 1) {
			nodeData.allowDrag = false;
		}
		
		/* We'd like to set leaf here. For some reason, the tree
		 * is stupid.
		 * 
		 * If the node is a leaf, it's not possible to append children. I would
		 * have expected that the "leaf" flag is cleared when a child is appended.
		 * 
		 * If the node is not a leaf, the node should (in theory) use the children
		 * count. However, it doesn't do that in our case and always shows the "expand"
		 * button unless clicked once.
		 */
		
		/*if (data.children.length === 0) {
			nodeData.leaf = true;
		} else {
			nodeData.leaf = false;
		}*/
		
		nodeData.leaf = false;
                nodeData.loaded = true;
		
		var node = root.appendChild(Ext.create(this.categoryModel, nodeData));
		
		for ( var i = 0; i < data.children.length; i++) {
			this.buildCategoryTree(node, data.children[i], expandedNodes);
		}
	}
});
Ext.define("PartKeepr.CategoryEditorTree", {
	alias: 'widget.CategoryEditorTree',
	extend: 'PartKeepr.CategoryTree',
	ddGroup: null,
	categoryModel: null,
	categoryService: null,
	initComponent: function () {
		if (this.ddGroup !== null) {
			Ext.apply(this, { 
				viewConfig: {
					animate: false,
					plugins: {
						ptype: 'treeviewdragdrop',
						ddGroup: this.ddGroup
					}
				}});	
		}
		
		this.createToolbar();
		
		this.callParent();
		
		this.getView().on("drop", Ext.bind(this.onCategoryDrop, this));
		this.getView().on("beforedrop", this.onBeforeDrop, this);
		this.getView().on("itemcontextmenu", Ext.bind(this.onItemContextMenu, this));
		
		this.createMenu();
		
	},
	onBeforeDrop: function () {
		
	},
	onCategoryDrop: function (node, data, model, pos) {
		var draggedRecord = data.records[0];
		var droppedOn = this.getView().getRecord(node);
		
		if (!draggedRecord.isCategory) {
			return;
		} else {
			/* Must be a category */
			
			var targetRecord;
			
			if (pos == "after" || pos == "before") {
				targetRecord = droppedOn.parentNode;
			} else {
				targetRecord = droppedOn;
			}
			
			this.getStore().sort("name", "ASC");
			
			var call = new PartKeepr.ServiceCall(this.categoryService, "moveCategory");
			call.setLoadMessage(sprintf(i18n("Moving category %s..."), draggedRecord.get("name")));
			call.setParameter("category", draggedRecord.get("id"));
			call.setParameter("target", targetRecord.get("id"));
			call.doCall();
		}
		
	},

	onItemContextMenu: function (view, record, item, index, event) {
		if (!record.isCategory) { return; }
		var menu = this.menu;
		event.stopEvent();
		
		menu.record = record;

		this.menuCategoryDelete.enable();
		
		if (record.get("id") == 1) {
			this.menuCategoryDelete.disable();
		}
		
		if (record.hasChildNodes()) {
			this.menuCategoryDelete.disable();
		}

	    menu.showAt(event.getXY());
	},
	createMenu: function () {
		this.menuCategoryDelete = Ext.create("Ext.menu.Item", {
			text: i18n("Delete Category"),
			handler: Ext.bind(this.confirmCategoryDelete, this),
			icon: 'resources/silkicons/folder_delete.png'
		});
		
		this.menuCategoryAdd = Ext.create("Ext.menu.Item", {
			text: i18n("Add Category"),
			handler: Ext.bind(this.showCategoryAddDialog, this),
			icon: 'resources/silkicons/folder_add.png'
		});
		
		this.menuCategoryEdit = Ext.create("Ext.menu.Item", {
			text: i18n("Edit Category"),
			handler: Ext.bind(this.showCategoryEditDialog, this),
			icon: 'resources/silkicons/folder_edit.png'
		});
		
		this.menu = Ext.create('widget.menu', {
            items: [
                this.menuCategoryAdd,
                this.menuCategoryEdit,
                this.menuCategoryDelete
                ]
        });
	},
	createToolbar: function () {
		this.toolbarExpandButton = Ext.create("Ext.button.Button", {
			icon: 'resources/fugue-icons/icons/toggle-expand.png',
			tooltip: i18n("Expand All"),
			handler: this._onExpandClick,
			scope: this
		});
		
		this.toolbarCollapseButton = Ext.create("Ext.button.Button", {
			icon: 'resources/fugue-icons/icons/toggle.png',
			tooltip: i18n("Collapse All"),
			handler: this._onCollapseClick,
			scope: this
		});
		
		this.toolbarReloadButton = Ext.create("Ext.button.Button", {
			icon: 'extjs/resources/themes/images/default/grid/refresh.gif',
			tooltip: i18n("Reload"),
			handler: this._onReloadClick,
			scope: this
		});
		
		this.toolbar = Ext.create("Ext.toolbar.Toolbar", {
			enableOverflow: true,
			dock: 'top',
			items: [ this.toolbarExpandButton, this.toolbarCollapseButton, this.toolbarReloadButton ]
		});
		
		Ext.apply(this, {
			dockedItems: [ this.toolbar ]
		});
	},
	_onReloadClick: function () {
		this.loadCategories();
	},
	_onExpandClick: function () {
		this.getRootNode().firstChild.expand(true);
	},
	_onCollapseClick: function () {
		this.getRootNode().firstChild.collapse(true);
	},
	confirmCategoryDelete: function () {
		Ext.Msg.confirm(i18n("Confirm Category Delete"), sprintf(i18n("Do you really wish to delete the category %s?"), this.menu.record.get("name")), this.onCategoryDelete, this);
	},
	showCategoryAddDialog: function () {
		var j = Ext.create("PartKeepr.CategoryEditorWindow", {
			record: null,
			categoryModel: this.categoryModel,
			parent: this.menu.record.get("id"),
			listeners: {
				save: Ext.bind(this.onUpdateRecord, this)
			}
		});
		
		j.show();
	},
	showCategoryEditDialog: function () {
		var j = Ext.create("PartKeepr.CategoryEditorWindow", {
			record: this.menu.record,
			parent: null,
			categoryModel: this.categoryModel,
			listeners: {
				save: Ext.bind(this.onUpdateRecord, this)
			}
		});
		
		j.show();
	},
	onUpdateRecord: function (record) {
		var currentRecord = this.getStore().getRootNode().findChild("id", record.get("id"), true);
		
		if (currentRecord === null) {
			var parentRecord = this.getStore().getRootNode().findChild("id", record.get("parent"), true);
			
			var nodeData = {
					id : record.get("id"),
					name : record.get("name"),
					tooltip : record.get("description")
				};
			
			parentRecord.appendChild(nodeData);
			
		} else {
			currentRecord.set("name", record.get("name"));
			currentRecord.set("description", record.get("description"));
			currentRecord.commit();	
		}
		
	},
	onCategoryDelete: function (btn) {
		if (btn == "yes") {
			var del = this.getStore().getRootNode().findChild("id", this.menu.record.get("id"), true);
			del.destroy({
				failure: function () {
			     	this.loadCategories();   
			    },
			    scope: this
			});
		}
	}
});
Ext.define("PartKeepr.FootprintTree", {
	extend: 'PartKeepr.CategoryEditorTree',
	alias: 'widget.FootprintTree',
	
	ddGroup: 'FootprintTree',
	categoryModel: 'PartKeepr.FootprintCategory',
	categoryService: 'FootprintCategory',
	folderSort: true,
	
	/**
     * @cfg {String} text The path to the 'add' icon
     */
	addButtonIcon: 'resources/icons/footprint_add.png',
	
	/**
     * @cfg {String} text The path to the 'delete' icon
     */
	deleteButtonIcon: 'resources/icons/footprint_delete.png',
	
	/**
	 * Initializes the component
	 */
	initComponent: function () {
		this.callParent();
		
		this.addEvents("itemEdit");
		
		this.on("itemclick", Ext.bind(function (t,record) {
			if (record.get("footprintId")) {
				this.fireEvent("itemEdit", record.get("footprintId"));
			}
		}, this));
		
		this.addButton = Ext.create("Ext.button.Button",
				{
		        	tooltip: i18n("Add Footprint"),
			        icon: this.addButtonIcon,
			        handler: this._onAddFootprint,
			        scope: this
			    });
		
		this.deleteButton = Ext.create("Ext.button.Button", {
			tooltip: i18n("Delete Footprint"),
			icon: this.deleteButtonIcon,
        	handler: Ext.bind(function () {
        		this.fireEvent("itemDelete");
        	}, this),
        	disabled: true
		});
		
		this.toolbar.add(['-', this.addButton, this.deleteButton]);
		
		this.getSelectionModel().on("select", 	this._onItemSelect, 	this);
		this.getSelectionModel().on("deselect", this._onItemDeselect, 	this);
	},
	/**
	 * Called when a footprint is about to be added
	 */
	_onAddFootprint: function () {
		var r = this.getSelectionModel().getLastSelected();
    	
    	if (r && !r.get("footprintId")) {
    		this.fireEvent("itemAdd", { category: r.get("id") });
    	} else {
    		if (!r) {
    			this.fireEvent("itemAdd", this.getRootNode().get("id"));
    		} else {
    			/* Try to find the category's parent id */
        		if (r.parentNode && !r.parentNode.get("footprintId")) {
        			this.fireEvent("itemAdd", { category: r.parentNode.get("id") });	
        		} else {
        			this.fireEvent("itemAdd", this.getRootNode().get("id"));
        		}	
    		}
    		
    	}
	},
	/**
	 * Called when an item was selected
	 */
	_onItemSelect: function (selectionModel, record) {
		this._updateDeleteButton(selectionModel, record);
		this.fireEvent("itemSelect", record);
	},
	/**
	 * Called when an item was deselected
	 */
	_onItemDeselect: function (selectionModel, record) {
		this._updateDeleteButton(selectionModel, record);
		this.fireEvent("itemDeselect", record);
	},
	/**
	 * Called when an item was selected. Enables/disables the delete button. 
	 */
	_updateDeleteButton: function (selectionModel, record) {
		/* Right now, we support delete on a single record only */
		if (this.getSelectionModel().getCount() == 1 && record.get("footprintId")) {
			this.deleteButton.enable();
		} else {
			this.deleteButton.disable();
		}
	},
	syncChanges: function (record) {
		var oldRecordIndex = PartKeepr.getApplication().getFootprintStore().find("id", record.get("id"));
		
		if (oldRecordIndex === -1) {
			/* Record doesn't exist yet; add it */
			PartKeepr.getApplication().getFootprintStore().add(record);
		} else {
			var oldRecord = PartKeepr.getApplication().getFootprintStore().getAt(oldRecordIndex);
			oldRecord.set("name", record.get("name"));	
		}
		
		this.loadCategories();
	},
	_onCategoriesLoaded: function () {
		this.callParent(arguments);
		var store = PartKeepr.getApplication().getFootprintStore();
		var category_id;
		var nodeData, record;
		
		for (var i=0;i<store.getCount();i++) {
			record = store.getAt(i);
			
			nodeData = {
					name: record.getRecordName(),
					footprintId: record.get("id"),
					leaf: true,
					iconCls:'icon-footprint'
			};
			

			if (record.get("category") === 0) {
				this.getRootNode().firstChild.appendChild(nodeData);
			} else {
				var node = this.getRootNode().findChild("id", record.get("category"), true);
				
				if (node) {
					node.appendChild(nodeData);
				} else {
					this.getRootNode().firstChild.appendChild(nodeData);
				}	
			}
			
		}
		
	},
	onBeforeDrop: function (node, data, overModel, dropPosition, dropFunction, options) {
		var draggedRecord = data.records[0];
		var droppedOn = this.getView().getRecord(node);

		if (droppedOn.get("footprintId")) {
			// Target record is a footprint, we don't allow moving categories onto footprints
			return false;
		}
		
		if (draggedRecord.get("footprintId")) {
			/* Move Footprint */
			var call = new PartKeepr.ServiceCall("Footprint", "moveFootprint");
			
			call.setParameter("id", draggedRecord.get("footprintId"));
			call.setParameter("targetCategory", droppedOn.get("id"));
			call.setHandler(Ext.bind(function () {
				var node = this.getRootNode().findChild("footprintId", draggedRecord.get("footprintId"), true);
				
				var targetNode = this.getRootNode().findChild("id", droppedOn.get("id"), true);
				targetNode.expand();
				
				node.remove();
				
				targetNode.appendChild(node);
				
				var oldRecordIndex = PartKeepr.getApplication().getFootprintStore().find("id", draggedRecord.get("footprintId"));
				var oldRecord = PartKeepr.getApplication().getFootprintStore().getAt(oldRecordIndex);

				oldRecord.set("category", droppedOn.get("id"));
				
			}, this));
			call.doCall();
			
			return false;
		}
		
	}
	
});
Ext.define("PartKeepr.PartCategoryTree", {
	extend: 'PartKeepr.CategoryEditorTree',
	alias: 'widget.PartCategoryTree',
	
	ddGroup: 'PartTree',
	categoryModel: 'PartKeepr.PartCategory',
	categoryService: 'PartCategory',
	initComponent: function () {
		this.addEvents("syncCategory");
		this.callParent();
		
		this.syncButton = Ext.create("Ext.button.Button", {
			tooltip: i18n("Reveal Category for selected part"),
			icon: 'resources/fugue-icons/icons/arrow-split-180.png',
        	handler: Ext.bind(function () {
        		this.fireEvent("syncCategory");
        	}, this),
        	disabled: true
		});
		this.toolbar.add(['->', this.syncButton]);
	},
	
	onBeforeDrop: function (node, data, overModel, dropPosition, dropFunction, options) {
		var draggedRecord = data.records[0];
		var droppedOn = this.getView().getRecord(node);

		if (draggedRecord.modelName == "PartKeepr.Part") {
			/* Move Part */
			var call = new PartKeepr.ServiceCall("Part", "movePart");
			
			if (data.records.length > 1) {
				var sources = [];
			
				for (var i=0;i<data.records.length;i++) {
					sources.push(data.records[i].get("id"));
				}
				
				call.setParameter("parts", sources);
			} else {
				call.setParameter("part", draggedRecord.get("id"));
			}

			call.setParameter("targetCategory", droppedOn.get("id"));
			call.setHandler(function () {
				data.view.store.load();
			});
			call.doCall();
			
			return false;
		}
		
	}
});
/**
 * @class PartKeepr.PartManager
 * @todo Document the editor system a bit better 
 * 
 * The part manager encapsulates the category tree, the part display grid and the part detail view.
 */
Ext.define('PartKeepr.PartManager', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.PartManager',
	layout: 'border',
	id: 'partkeepr-partmanager',
	border: false,
	padding: 5,
	initComponent: function () {
		
		/**
		 * Create the store with the default sorter "name ASC"
		 */
		this.createStore({
			 model: 'PartKeepr.Part',
			 proxy: PartKeepr.getRESTProxy("Part"),
			 groupField: 'categoryPath',
			 sorters: [{
				 property: 'name',
				 direction:'ASC'
			 }] 
		 });
		
		// Create the tree
		this.tree = Ext.create("PartKeepr.PartCategoryTree", {
			region: 'west',
			categoryModel: 'PartKeepr.PartCategory',
			categoryService: 'PartCategory',
			split: true,
			title: i18n("Categories"),
			ddGroup: 'CategoryTree',
			width: 300,			// @todo Make this configurable
			collapsible: true	// We want to collapse the tree panel on small screens
		});
		
		// Trigger a grid reload on category change
		this.tree.on("selectionchange", Ext.bind(function (t,s) {
			if (s.length > 0) {
				this.grid.setCategory(s[0].get("id"));
			}
		}, this));
		
		// Create the detail panel
		this.detail = Ext.create("PartKeepr.PartDisplay", { title: i18n("Part Details") });
		this.detail.on("editPart", this.onEditPart, this);
		
		// Create the grid
		this.grid = Ext.create("PartKeepr.PartsGrid", { title: i18n("Parts List"), region: 'center', layout: 'fit', store: this.getStore()});
		this.grid.on("editPart", this.onEditPart, this);
		
		// Create the grid listeners
		this.grid.on("itemSelect", this.onItemSelect, this);
		this.grid.on("itemDeselect", this.onItemSelect, this);
		this.grid.on("itemAdd", this.onItemAdd, this);
		this.grid.on("itemDelete", this.onItemDelete, this);
		this.grid.on("itemCreateFromTemplate", this.onItemCreateFromTemplate, this);
		this.tree.on("syncCategory", this.onSyncCategory, this);
		
		// Listen on the partChanged event, which is fired when the users edits the part
		this.detail.on("partChanged", function () { this.grid.getStore().load(); }, this);
		
		// Create the stock level panel
		this.stockLevel = Ext.create("PartKeepr.PartStockHistory", { title: "Stock History"});
		
		this.detailPanel = Ext.create("Ext.tab.Panel", {
			title: i18n("Part Details"),
			collapsed: true,
			collapsible: true,
			region: 'east',
			split: true,
			width: 300,
			animCollapse: false,
			items: [ this.detail, this.stockLevel ]
		});
		
		this.filterPanel = Ext.create("PartKeepr.PartFilterPanel", {
			region: 'south',
			title: i18n("Filter"),
			height: 200,
			split: true,
			collapsed: true,
			collapsible: true,
			store: this.store
		});
		
		this.items = [ this.tree, {
			layout: 'border',
			border: false,
			region: 'center',
			items: [ this.grid, this.filterPanel ]
		}, this.detailPanel ]; 
		
		
		this.callParent();
	},
	/**
	 * Called when the sync button was clicked. Highlights the category
	 * of the selected part for a short time. We can't select the category
	 * as this would affect the parts grid.
	 */
	onSyncCategory: function () {
		var r = this.grid.getSelectionModel().getLastSelected();
		
		var rootNode = this.tree.getRootNode();
		var cat = r.get("category");
		
		var node = rootNode.findChild("id", cat, true);
		
		this.tree.getView().ensureVisible(node);
		this.tree.getView().scrollIntoView(node);
		
		var htmlNode = new Ext.Element(this.tree.getView().getNode(node));
		
		htmlNode.highlight("2aaad3");
	},
	/**
     * Called when the delete button was clicked.
     * 
     * Prompts the user if he really wishes to delete the part. If yes, it calls deletePart.
     */
	onItemDelete: function () {
		var r = this.grid.getSelectionModel().getLastSelected();
		
		Ext.Msg.confirm(i18n("Delete Part"), sprintf(i18n("Do you really wish to delete the part %s?"),r.get("name")), this.deletePart, this);
	},
	/**
	 * Creates a duplicate from the selected item. Loads the selected part and calls createPartDuplicate
	 * after the part was loaded.
	 * 
	 * @param none
	 * @return nothing
	 */
	onItemCreateFromTemplate: function () {
		var r = this.grid.getSelectionModel().getLastSelected();
		
		this.loadPart(r.get("id"), Ext.bind(this.createPartDuplicate, this));
	},
	/**
	 * Creates a part duplicate from the given record and opens the editor window.
	 * @param rec The record to duplicate
	 */
	createPartDuplicate: function (rec) {
		var copy = rec.copy();
		Ext.data.Model.id(copy);
		copy.set("id", null);
		
		var j = Ext.create("PartKeepr.PartEditorWindow", {
			partMode: 'create'
		});
		
		j.editor.on("partSaved", this.onPartSaved, this);
		j.editor.editItem(copy);
		j.show();
	},
	/**
     * Deletes the selected part.
     * 
     * @param {String} btn The clicked button in the message box window.
     * @todo We use the current selection of the grid. If for some reason the selection changes during the user is prompted,
     * we delete the wrong part. Fix that to pass the selected item to the onItemDelete then to this function.
     */
	deletePart: function (btn) {
		var r = this.grid.getSelectionModel().getLastSelected();
		
		if (btn == "yes") {
			var call = new PartKeepr.ServiceCall(
					"Part", 
					"deletePart");
			
			call.setLoadMessage(sprintf(i18n("Deleting part %s"), r.get("name")));
			call.setParameter("part", r.get("id"));
			call.setHandler(Ext.bind(function () {
				this.store.load();
			}, this));
			call.doCall();
		}
	},
	/**
     * Creates a new, empty part editor window
     */
	onItemAdd: function () {
		var j = Ext.create("PartKeepr.PartEditorWindow", {
			partMode: 'create'
		});
		
		var defaults = {};
		
		var defaultPartUnit = PartKeepr.getApplication().getPartUnitStore().findRecord("default", true);
		
		defaults.partUnit = defaultPartUnit.get("id");
		defaults.category = this.grid.currentCategory;
		
		record = Ext.create("PartKeepr.Part", defaults);
		
		// Inject the defaults to the editor, so the editor can create a new item on its own
		j.editor.partDefaults = defaults;
		
		j.editor.editItem(record);
		j.show();
		
		return j;
	},
	/**
     * Called when a part was edited. Refreshes the grid.
     */
	onEditPart: function (id) {
		this.loadPart(id, Ext.bind(this.onPartLoaded, this));
	},
	/**
     * Called when a part was loaded. Displays the part in the editor window.
     */
	onPartLoaded: function (f,g) {
		var j = Ext.create("PartKeepr.PartEditorWindow");
		j.editor.on("partSaved", this.onPartSaved, this);
		j.editor.editItem(f);
		j.show();
	},
	onPartSaved: function (record) {
	
		var idx = this.grid.store.find("id", record.get("id"));
		
		// Only reload the grid if the edited record is contained
		if (idx !== -1) {
			this.grid.store.load();
		}
		
		this.detail.setValues(record);
	},
	/**
     * Called when a part was selected in the grid. Displays the details for this part.
     */
	onItemSelect: function () {
		if (this.grid.getSelectionModel().getCount() > 1) {
			this.detailPanel.collapse();
			this.tree.syncButton.disable();
		} else if (this.grid.getSelectionModel().getCount() == 1) {
			var r = this.grid.getSelectionModel().getLastSelected();
			
			this.detailPanel.setActiveTab(this.detail);
			this.detailPanel.expand();
			this.detail.setValues(r);
			this.stockLevel.part = r.get("id");
			
			this.tree.syncButton.enable();
		} else {
			this.tree.syncButton.disable();
		}
		
	},
	/**
     * Triggers loading of a part 
     * @param {Integer} id The ID of the part to load
     * @param {Function} handler The callback to call when the part was loaded
     */
	loadPart: function (id, handler) {
		// @todo we have this method duplicated in PartEditor
		var model = Ext.ModelManager.getModel("PartKeepr.Part");
		
		model.load(id, {
			scope: this,
		    success: handler
		});
	},
	/**
     * Creates the store 
     */
	createStore: function (config) {
		Ext.Object.merge(config, {
				autoLoad: true,
				autoSync: false, // Do not change. If true, new (empty) records would be immediately commited to the database.
				remoteFilter: true,
				remoteSort: true,
				pageSize: 50});
		
		this.store = Ext.create('Ext.data.Store', config);
		
		// Workaround for bug http://www.sencha.com/forum/showthread.php?133767-Store.sync()-does-not-update-dirty-flag&p=607093#post607093
		this.store.on('write', function(store, operation) {
	        var success=operation.wasSuccessful();
	        if (success) {
	            Ext.each(operation.records, function(record){
	                if (record.dirty) {
	                    record.commit();
	                }
	            });
	        }
		});
	},
	/**
     * Returns the store 
     */
	getStore: function () {
		return this.store;
	}
});
/**
 * This class defines a window which is used to in- or decrease the stock level
 * for a specific part. Logic and service calls are not contained in this window,
 * and need to be implemented from the caller.
 */
Ext.define('PartKeepr.PartStockWindow', {
	extend: 'Ext.window.Window',
	
	// Configurations
	constrainHeader: true,
	width: 300,
	height: 150,
	
	resizable: false,
	layout: 'fit',
	
	// We set the title later
	title: "",
	
	// Window title texts
	removePartText: i18n("Remove Part(s)"),
	addPartText: i18n("Add Part(s)"),
	
	layout: 'anchor',
	bodyStyle: {
		padding: "5px"
	},
	
	/*
	 * Initializes the window with the quantity and price fields.
	 * The price field is hidden when a stock decrease happens.
	 */
	initComponent: function () {
		
		this.quantityField = Ext.create("Ext.form.field.Number", {
			value: 0,		// The initial value is 0, to indicate that this is a number field
			minValue: 1,	// The minimum value is 1. That way we force the user to enter a value
			width: 100,
			listeners: {
                specialkey: {
                	fn: function(field, e){
                		if (e.getKey() == e.ENTER) {
                			this.onOKClick();
                		}
                	},
                	scope: this
                }
			}
		});
		
		this.priceField = Ext.create("Ext.form.field.Number", {
			hideTrigger: true,
			keyNavEnabled: false,
	        mouseWheelEnabled: false,
	        anchor: '100%',
	        value: 0,
			fieldLabel: i18n("Price"),
			listeners: {
                specialkey: {
                	fn: function(field, e){
                		if (e.getKey() == e.ENTER) {
                			this.onOKClick();
                		}
                	},
                	scope: this
                }
			}
		});
		
		this.priceCheckbox = Ext.create("Ext.form.field.Checkbox", {
			boxLabel: i18n("Price per item"),
			hideEmptyLabel: false,
			checked: true
		});
		
		this.form = Ext.create("Ext.form.Panel", {
			bodyStyle: 'background:#DBDBDB;',
			border: false,
			items: [{
					xtype: 'fieldcontainer',
					fieldLabel: i18n("Quantity"),
					layout: 'hbox',
					items: [ this.quantityField, { width: 75, xtype: 'displayfield', margin: "0 0 0 5", value: this.partUnitName }]
			}, this.priceField, this.priceCheckbox ]
		});
		
		this.items = this.form;
		
		this.buttons = [
		                {
		                	text: i18n("Close"),
		                	handler: this.onCloseClick,
		                	scope: this
		                },{
		                	text: i18n("OK"),
		                	handler: this.onOKClick,
		                	scope: this
		                }];
		this.on("show", function () { this.quantityField.focus(); }, this);
		this.callParent();
	},
	/**
	 * Closes the window
	 */
	onCloseClick: function () {
		this.close();
	},
	/**
	 * Checks if the form is valid. If yes, execute the callback.
	 */
	onOKClick: function () {
		if (this.form.getForm().isValid()) {
			var price;
			if (this.priceCheckbox.getValue()) {
				price = this.priceField.getValue();
			} else {
				price = this.priceField.getValue() / this.quantityField.getValue();
			}
			
			Ext.callback(this.callbackFn, this.callbackScope, [ this.quantityField.getValue(), price ]);
			this.close();
		}
	},
	/**
	 * Opens the window in "add stock" mode. The target callback receives two parameters:
	 * the value of the quantity field and the value of the price field.
	 * 
	 * @param fn The callback
	 * @param scope The scope in which to execute the callback
	 */
	addStock: function (fn, scope) {
		this.callbackFn = fn;
		this.callbackScope = scope;
		this.setTitle(this.addPartText);
		this.show();
	},
	/**
	 * Opens the window in "remove stock" mode. The target callback receives one parameters:
	 * the value of the quantity field
	 * 
	 * @param fn The callback
	 * @param scope The scope in which to execute the callback
	 */
	removeStock: function (fn, scope) {
		this.callbackFn = fn;
		this.callbackScope = scope;
		this.setTitle(this.removePartText);
		this.priceField.hide();
		this.priceCheckbox.hide();
		this.show();
	}
});
/**
 * @class PartKeepr.PartEditorWindow

 * <p>The PartEditorWindow encapsulates the PartKeepr.PartEditor within a window.</p>
 */
Ext.define('PartKeepr.PartEditorWindow', {
	extend: 'Ext.window.Window',
	
	/* Constrain the window to fit the viewport */
	constrainHeader: true,
	
	/* Fit the editor within the window */
	layout: 'fit',
	
	/* Width and height settings */
	width: 600,
	minWidth: 600,
	minHeight: 390,
	height: 390,
	
	saveText: i18n("Save"),
	cancelText: i18n("Cancel"),
	
	/* Default edit mode. If mode = "create", we show additional fields */
	partMode: 'edit',
	title: i18n("Add Part"),
	
	/**
	 * Creates the part editor and put it into the window.
	 */
	initComponent: function () {
		this.editor = Ext.create("PartKeepr.PartEditor", {
			border: false,
			partMode: this.partMode,
			enableButtons: false
		});
		
		/* If the edit mode is "create", we need to enlarge the window a bit to fit the fields without scrolling */
		if (this.partMode && this.partMode == "create") {
			this.height = 445;
		}
		
		this.items = [ this.editor ];

		/**
		 * We need a delay, since if others are listening for "editorClose", the dialog plus the record could be destroyed
		 * before any following listeners have a chance to receive the record, resulting in strange problems.
		 */
		this.editor.on("editorClose", function (context) { this.close();}, this, { delay: 200 });
		
		this.editor.on("titleChange", function (val) { this.setTitle(val); }, this);
		this.editor.on("itemSaved", this.onItemSaved, this);
		
		this.saveButton = Ext.create("Ext.button.Button", {
			text: this.saveText,
			icon: 'resources/fugue-icons/icons/disk.png',
			handler: Ext.bind(this.onItemSave, this)
		});
		
		this.cancelButton = Ext.create("Ext.button.Button", {
			text: this.cancelText,
			icon: 'resources/silkicons/cancel.png',
			handler: Ext.bind(this.onCancelEdit, this)
		});
		
		this.bottomToolbar = Ext.create("Ext.toolbar.Toolbar", {
			enableOverflow: true,
			defaults: {minWidth: 100},
			dock: 'bottom',
			ui: 'footer',
			pack: 'start',
			items: [ this.saveButton, this.cancelButton ]
		});
		
		this.dockedItems = [ this.bottomToolbar ];
		
		this.keepOpenCheckbox = Ext.create("Ext.form.field.Checkbox", {
			boxLabel: i18n("Create blank item after save")
		});
		
		if (this.partMode == "create") {
			this.bottomToolbar.add(this.keepOpenCheckbox);
		}
		
		this.editor.keepOpenCheckbox = this.keepOpenCheckbox;
		
		this.callParent();
	},
	onCancelEdit: function () {
		this.editor.onCancelEdit();
	},
	/**
	 * Called when the save button was clicked
	 */
	onItemSave: function () {
		if (!this.editor.getForm().isValid()) { return; }
		
		// Disable the save button to indicate progress
		this.saveButton.disable();
		
		// Sanity: If the save process fails, re-enable the button after 30 seconds
		Ext.defer(function () { this.saveButton.enable(); }, 30000, this);
		
		this.editor._onItemSave();
	},
	/**
	 * Called when the item was saved
	 */
	onItemSaved: function () {
		this.saveButton.enable();
	}
});

Ext.define('PartKeepr.PartFilterPanel', {
	extend: 'Ext.form.Panel',
	alias: 'widget.PartFilterPanel',
	bodyPadding: '10px',
	layout: 'column',
	bodyStyle: 'background:#DBDBDB;',
	initComponent: function () {
		
		// Create the filter fields
		this.createFilterFields();
		

		// Creates the left column of the filter panel
		this.leftColumn = {
				xtype: 'container',
            	anchor: '100%',
            	layout: 'anchor',
            	columnWidth: 0.5,
            	items: [
            	        this.storageLocationFilter,
            	        this.categoryFilter,
            	        this.partsWithoutPrice
            	        ]
		};
		
		// Creates the right column of the filter panel
		this.rightColumn = {
				xtype: 'container',
            	anchor: '100%',
            	columnWidth: 0.5,
            	layout: 'anchor',
            	items: [
            	        this.stockFilter,
            	        this.distributorOrderNumberFilter
            	        ]
		};
		
		// Apply both columns to this panel
		this.items = [ this.leftColumn, this.rightColumn ];
		
		// Create the reset button
		this.resetButton = Ext.create("Ext.button.Button", {
			text: i18n("Reset"),
			handler: this.onReset,
			icon: 'resources/diagona-icons/icons/16/101.png',
			scope: this
		});
		
		// Create the apply button
		this.applyButton = Ext.create("Ext.button.Button", {
			text: i18n("Apply"),
			icon: 'resources/diagona-icons/icons/16/102.png',
			handler: this.onApply,
			scope: this
		});
		
		// Append both buttons to a toolbar
		this.dockedItems = [{
			xtype: 'toolbar',
			enableOverflow: true,
			dock: 'bottom',
			defaults: {minWidth: 100},
			items: [ this.applyButton, this.resetButton ]
		}];
		
		this.callParent();
	},
	/**
	 * Applies the parameters from the filter panel to the proxy, then
	 * reload the store to refresh the grid.
	 */
	onApply: function () {
		this.applyFilterParameters(this.store.getProxy().extraParams);
		this.store.currentPage = 1;
		this.store.load({ start: 0});
	},
	/**
	 * Resets the fields to their original values, then call onApply()
	 * to reload the store.
	 */
	onReset: function () {
		this.storageLocationFilter.setValue("");
		this.categoryFilter.setValue({ category: 'all'});
		this.stockFilter.setValue({ stock: 'any'});
		this.distributorOrderNumberFilter.setValue("");
		
		this.onApply();
	},
	/**
	 * Creates the filter fields required for this filter panel
	 */
	createFilterFields: function () {
		
		// Create the storage location filter field
		this.storageLocationFilter = Ext.create("PartKeepr.StorageLocationComboBox", {
			fieldLabel: i18n("Storage Location"),
			forceSelection: true
		});
		
		// Create the category scope field
		this.categoryFilter = Ext.create("Ext.form.RadioGroup", {
			fieldLabel: i18n("Category Scope"),
			columns: 1,
			items: [{
			        	boxLabel: i18n("All Subcategories"),
			        	name: 'category',
			        	inputValue: "all",
			        	checked: true
			        },
			        {
			        	boxLabel: i18n("Selected Category"),
			        	name: 'category',
			        	inputValue: "selected"
			        }]
		});
		
		// Create the stock level filter field
		this.stockFilter = Ext.create("Ext.form.RadioGroup", {
			fieldLabel: i18n("Stock Mode"),
			columns: 1,
			items: [{
			        	boxLabel: i18n("Any Stock Level"),
			        	name: 'stock',
			        	inputValue: "any",
			        	checked: true
			        },{
			        	boxLabel: i18n("Stock Level = 0"),
			        	name: 'stock',
			        	inputValue: "zero"
			        },{
			        	boxLabel: i18n("Stock Level > 0"),
			        	name: 'stock',
			        	inputValue: "nonzero"
			        },{
			        	boxLabel: i18n("Stock Level < Minimum Stock Level"),
			        	name: 'stock',
			        	inputValue: "below"
			        }]
		});
		
		this.partsWithoutPrice = Ext.create("Ext.form.field.Checkbox", {
			fieldLabel: i18n("Item Price"),
			boxLabel: i18n("Show Parts without Price only")
		});
		
		this.distributorOrderNumberFilter = Ext.create("Ext.form.field.Text", {
			fieldLabel: i18n("Order Number")
		});
	},
	/**
	 * Applies the filter parameters to the passed extraParams object.
	 * @param extraParams An object containing the extraParams from a proxy.
	 */
	applyFilterParameters: function (extraParams) {
		extraParams.withoutPrice = this.partsWithoutPrice.getValue();
		extraParams.categoryScope = this.categoryFilter.getValue().category;
		extraParams.stockMode = this.stockFilter.getValue().stock;
		extraParams.distributorOrderNumber = this.distributorOrderNumberFilter.getValue();
		/**
		 * Get the raw (=text) value. I really wish that ExtJS would handle selected values (from a store)
		 * distinct than entered values.
		 */ 
		if (this.storageLocationFilter.getRawValue() !== "") {
			extraParams.storageLocation = this.storageLocationFilter.getRawValue();
		} else {
			delete extraParams.storageLocation;
		}
		
	}
	
});
/**
 * @class PartKeepr.PartDisplay
 * <p>This component displays information about a specific part.</p>
 */
Ext.define('PartKeepr.PartDisplay', {
	extend: 'Ext.panel.Panel',
	bodyCls: 'partdisplay',
	
	/**
	 * Initializes the component and adds a template as well as the add/remove stock and edit part buttons.
	 */
	initComponent: function () {
		/**
		 * Create the template
		 */
		this.tpl = new Ext.XTemplate(
				'<h1>{name}</h1>',
				'<table>',
				'<tr>',
					'<td class="o">'+i18n("Category")+':</td>',
					'<td style="width: 100%;" class="o">{categoryName}</td>',
				'</tr>',
				'<tr>',
					'<td class="e">'+i18n("Stock Level")+':</td>',
					'<td class="e">{stockLevel}</td>',
				'</tr>',
				'<tr>',
					'<td class="o">'+i18n("Minimum Stock Level")+':</td>',
					'<td class="o">{minStockLevel}</td>',
				'</tr>',
				'<tr>',
					'<td class="e">'+i18n("Footprint")+':</td>',
					'<td class="e">{footprintName}</td>',
				'</tr>',
				'<tr>',
					'<td style="white-space: nowrap;" class="o">'+i18n("Storage Location")+':</td>',
					'<td class="o">{storageLocationName}</td>',
				'</tr>',
				'<tr>',
					'<td class="e">'+i18n("Comment")+':</td>',
					'<td class="e">{comment}</td>',
				'</tr>',
				'<tr>',
					'<td class="o">'+i18n("Create Date")+':</td>',
					'<td class="o">{createDate}</td>',
				'</tr>',
				'<tr>',
					'<td class="e">'+i18n("Status")+':</td>',
					'<td class="e">{status}</td>',
				'</tr>',
				'<tr>',
					'<td class="o">'+i18n("Needs Review")+':</td>',
					'<td class="o">{needsReview}</td>',
					'</tr>',
				'</table>');
		
		/**
		 * Create the "add stock" button
		 */
		this.addButton = new Ext.Button({
			text: i18n("Add Stock"),
			icon: 'resources/silkicons/brick_add.png',
			handler: Ext.bind(this.addPartPrompt, this)
		});
		
		/**
		 * Create the "remove stock" button
		 */
		this.deleteButton = new Ext.Button({
			text: i18n("Remove Stock"),
			icon: 'resources/silkicons/brick_delete.png',
			handler: Ext.bind(this.deletePartPrompt, this)
		});
		
		/**
		 * Create the "edit part" button
		 */
		this.editButton = new Ext.Button({
			text: i18n("Edit Part"),
			icon: 'resources/silkicons/brick_edit.png',
			handler: Ext.bind(function () { this.fireEvent("editPart", this.record.get("id"));}, this)
		});
		
		/**
		 * Create the toolbar which holds our buttons
		 */
		this.tbar = Ext.create("Ext.toolbar.Toolbar", {
			enableOverflow: true,
			items: [
			        this.addButton,
			        this.deleteButton,
			        this.editButton
			        ]
		});
		
		/**
		 * Add the event "editPart". This event is fired as soon as the "edit" button is clicked.
		 * 
		 * @todo Add the events "addStock" and "removeStock" and manage these events from the PartManager.
		 */
		this.addEvents("editPart");
		
		this.callParent();
	},
	/**
	 * Sets the values for the template.
	 * 
	 * Note that the data of the record is applied with htmlentities(), i.e. <b>Test</b> will be
	 * displayed as such and not in bold.
	 */
	setValues: function (r) {
		this.record = r;
		
		var values = {};
		for (var i in r.data) {
			if (r.data[i] !== null) {
				values[i] = htmlentities(r.data[i]);
			} else {
				values[i] = r.data[i];
			}
		}
		
		this.tpl.overwrite(this.getTargetEl(), values);
	},
	/**
	 * Prompt the user for the stock level he wishes to add.
	 */
	addPartPrompt: function () {
		var j = new PartKeepr.PartStockWindow({ partUnitName: this.record.get("partUnitName") });
		j.addStock(this.addPartHandler, this);
	},
	/**
	 * Callback after the "add stock" dialog is complete.
	 */
	addPartHandler: function (quantity, price) {
			var call = new PartKeepr.ServiceCall(
	    			"Part", 
	    			"addStock");
			call.setParameter("stock", quantity);
			call.setParameter("price", price);
			call.setParameter("part", this.record.get("id"));
	    	call.setHandler(Ext.bind(this.reloadPart, this));
	    	call.doCall();	
	},
	/**
	 * Prompts the user for the stock level to decrease for the item.
	 */
	deletePartPrompt: function () {
		var j = new PartKeepr.PartStockWindow({ partUnitName: this.record.get("partUnitName") });
		j.removeStock(this.deletePartHandler, this);
	},
	/**
	 * Callback after the "delete stock" dialog is complete.
	 */
	deletePartHandler: function (quantity) {
			var call = new PartKeepr.ServiceCall(
	    			"Part", 
	    			"deleteStock");
			call.setParameter("stock", quantity);
			call.setParameter("part", this.record.get("id"));
	    	call.setHandler(Ext.bind(this.reloadPart, this));
	    	call.doCall();	
	},
	/**
	 * Reloads the current part
	 */
	reloadPart: function () {
		this.loadPart(this.record.get("id"));
	},
	/**
	 * Load the part from the database.
	 */
	loadPart: function (id) {
		PartKeepr.Part.load(id, {
			scope: this,
		    success: this.onPartLoaded
		});
	},
	/**
	 * Callback after the part is loaded
	 */
	onPartLoaded: function (record) {
		this.record = record;
		this.setValues(this.record);
		this.record.commit();
	}
});
/* JPEGCam v1.0.9 */
/* Webcam library for capturing JPEG images and submitting to a server */
/* Copyright (c) 2008 - 2009 Joseph Huckaby <jhuckaby@goldcartridge.com> */
/* Licensed under the GNU Lesser Public License */
/* http://www.gnu.org/licenses/lgpl.html */

/* Usage:
	<script language="JavaScript">
		document.write( webcam.get_html(320, 240) );
		webcam.set_api_url( 'test.php' );
		webcam.set_hook( 'onComplete', 'my_callback_function' );
		function my_callback_function(response) {
			alert("Success! PHP returned: " + response);
		}
	</script>
	<a href="javascript:void(webcam.snap())">Take Snapshot</a>
*/

// Everything is under a 'webcam' Namespace
window.webcam = {
	version: '1.0.9',
	
	// globals
	ie: !!navigator.userAgent.match(/MSIE/),
	protocol: location.protocol.match(/https/i) ? 'https' : 'http',
	callback: null, // user callback for completed uploads
	swf_url: 'webcam.swf', // URI to webcam.swf movie (defaults to cwd)
	shutter_url: 'shutter.mp3', // URI to shutter.mp3 sound
	api_url: '', // URL to upload script
	loaded: false, // true when webcam movie finishes loading
	quality: 90, // JPEG quality (1 - 100)
	shutter_sound: true, // shutter sound effect on/off
	stealth: false, // stealth mode (do not freeze image upon capture)
	hooks: {
		onLoad: null,
		onComplete: null,
		onError: null
	}, // callback hook functions
	
	set_hook: function(name, callback) {
		// set callback hook
		// supported hooks: onLoad, onComplete, onError
		if (typeof(this.hooks[name]) == 'undefined') {
			alert("Hook type not supported: " + name);
		} else {
			this.hooks[name] = callback;
		}
	},
	
	fire_hook: function(name, value) {
		// fire hook callback, passing optional value to it
		if (this.hooks[name]) {
			if (typeof(this.hooks[name]) == 'function') {
				// callback is function reference, call directly
				this.hooks[name](value);
			}
			else if (typeof(this.hooks[name]) == 'array') {
				// callback is PHP-style object instance method
				this.hooks[name][0][this.hooks[name][1]](value);
			}
			else if (window[this.hooks[name]]) {
				// callback is global function name
				window[ this.hooks[name] ](value);
			}
			return true;
		}
		return false; // no hook defined
	},
	
	set_api_url: function(url) {
		// set location of upload API script
		this.api_url = url;
	},
	
	set_swf_url: function(url) {
		// set location of SWF movie (defaults to webcam.swf in cwd)
		this.swf_url = url;
	},
	
	get_html: function(width, height, server_width, server_height) {
		// Return HTML for embedding webcam capture movie
		// Specify pixel width and height (640x480, 320x240, etc.)
		// Server width and height are optional, and default to movie width/height
		if (!server_width) server_width = width;
		if (!server_height) server_height = height;
		
		var html = '';
		var flashvars = 'shutter_enabled=' + (this.shutter_sound ? 1 : 0) + 
			'&shutter_url=' + escape(this.shutter_url) + 
			'&width=' + width + 
			'&height=' + height + 
			'&server_width=' + server_width + 
			'&server_height=' + server_height;
		
		if (this.ie) {
			html += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="'+this.protocol+'://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="'+width+'" height="'+height+'" id="webcam_movie" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="'+this.swf_url+'" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="'+flashvars+'"/></object>';
		}
		else {
			html += '<embed id="webcam_movie" src="'+this.swf_url+'" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="'+width+'" height="'+height+'" name="webcam_movie" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="'+flashvars+'" />';
		}
		
		this.loaded = false;
		return html;
	},
	
	get_movie: function() {
		// get reference to movie object/embed in DOM
		if (!this.loaded) return alert("ERROR: Movie is not loaded yet");
		var movie = document.getElementById('webcam_movie');
		if (!movie) alert("ERROR: Cannot locate movie 'webcam_movie' in DOM");
		return movie;
	},
	
	set_stealth: function(stealth) {
		// set or disable stealth mode
		this.stealth = stealth;
	},
	
	snap: function(url, callback, stealth) {
		// take snapshot and send to server
		// specify fully-qualified URL to server API script
		// and callback function (string or function object)
		if (callback) this.set_hook('onComplete', callback);
		if (url) this.set_api_url(url);
		if (typeof(stealth) != 'undefined') this.set_stealth( stealth );
		
		this.get_movie()._snap( this.api_url, this.quality, this.shutter_sound ? 1 : 0, this.stealth ? 1 : 0 );
	},
	
	freeze: function() {
		// freeze webcam image (capture but do not upload)
		this.get_movie()._snap('', this.quality, this.shutter_sound ? 1 : 0, 0 );
	},
	
	upload: function(url, callback) {
		// upload image to server after taking snapshot
		// specify fully-qualified URL to server API script
		// and callback function (string or function object)
		if (callback) this.set_hook('onComplete', callback);
		if (url) this.set_api_url(url);
		
		this.get_movie()._upload( this.api_url );
	},
	
	reset: function() {
		// reset movie after taking snapshot
		this.get_movie()._reset();
	},
	
	configure: function(panel) {
		// open flash configuration panel -- specify tab name:
		// "camera", "privacy", "default", "localStorage", "microphone", "settingsManager"
		if (!panel) panel = "camera";
		this.get_movie()._configure(panel);
	},
	
	set_quality: function(new_quality) {
		// set the JPEG quality (1 - 100)
		// default is 90
		this.quality = new_quality;
	},
	
	set_shutter_sound: function(enabled, url) {
		// enable or disable the shutter sound effect
		// defaults to enabled
		this.shutter_sound = enabled;
		this.shutter_url = url ? url : 'shutter.mp3';
	},
	
	flash_notify: function(type, msg) {
		// receive notification from flash about event
		switch (type) {
			case 'flashLoadComplete':
				// movie loaded successfully
				this.loaded = true;
				this.fire_hook('onLoad');
				break;

			case 'error':
				// HTTP POST error most likely
				if (!this.fire_hook('onError', msg)) {
					alert("JPEGCam Flash Error: " + msg);
				}
				break;

			case 'success':
				// upload complete, execute user callback function
				// and pass raw API script results to function
				this.fire_hook('onComplete', msg.toString());
				break;

			default:
				// catch-all, just in case
				alert("jpegcam flash_notify: " + type + ": " + msg);
				break;
		}
	}
};

/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.ux.StatusBar
 * <p>Basic status bar component that can be used as the bottom toolbar of any {@link Ext.Panel}.  In addition to
 * supporting the standard {@link Ext.toolbar.Toolbar} interface for adding buttons, menus and other items, the StatusBar
 * provides a greedy status element that can be aligned to either side and has convenient methods for setting the
 * status text and icon.  You can also indicate that something is processing using the {@link #showBusy} method.</p>
 * <pre><code>
Ext.create('Ext.Panel', {
    title: 'StatusBar',
    // etc.
    bbar: Ext.create('Ext.ux.StatusBar', {
        id: 'my-status',

        // defaults to use when the status is cleared:
        defaultText: 'Default status text',
        defaultIconCls: 'default-icon',

        // values to set initially:
        text: 'Ready',
        iconCls: 'ready-icon',

        // any standard Toolbar items:
        items: [{
            text: 'A Button'
        }, '-', 'Plain Text']
    })
});

// Update the status bar later in code:
var sb = Ext.getCmp('my-status');
sb.setStatus({
    text: 'OK',
    iconCls: 'ok-icon',
    clear: true // auto-clear after a set interval
});

// Set the status bar to show that something is processing:
sb.showBusy();

// processing....

sb.clearStatus(); // once completeed
</code></pre>
 * @extends Ext.toolbar.Toolbar
 * @constructor
 * Creates a new StatusBar
 * @param {Object/Array} config A config object
 */
Ext.define('Ext.ux.statusbar.StatusBar', {
    extend: 'Ext.toolbar.Toolbar',
    alternateClassName: 'Ext.ux.StatusBar',
    alias: 'widget.statusbar',
    requires: ['Ext.toolbar.TextItem'],
    /**
     * @cfg {String} statusAlign
     * The alignment of the status element within the overall StatusBar layout.  When the StatusBar is rendered,
     * it creates an internal div containing the status text and icon.  Any additional Toolbar items added in the
     * StatusBar's {@link #items} config, or added via {@link #add} or any of the supported add* methods, will be
     * rendered, in added order, to the opposite side.  The status element is greedy, so it will automatically
     * expand to take up all sapce left over by any other items.  Example usage:
     * <pre><code>
// Create a left-aligned status bar containing a button,
// separator and text item that will be right-aligned (default):
Ext.create('Ext.Panel', {
    title: 'StatusBar',
    // etc.
    bbar: Ext.create('Ext.ux.StatusBar', {
        defaultText: 'Default status text',
        id: 'status-id',
        items: [{
            text: 'A Button'
        }, '-', 'Plain Text']
    })
});

// By adding the statusAlign config, this will create the
// exact same toolbar, except the status and toolbar item
// layout will be reversed from the previous example:
Ext.create('Ext.Panel', {
    title: 'StatusBar',
    // etc.
    bbar: Ext.create('Ext.ux.StatusBar', {
        defaultText: 'Default status text',
        id: 'status-id',
        statusAlign: 'right',
        items: [{
            text: 'A Button'
        }, '-', 'Plain Text']
    })
});
</code></pre>
     */
    /**
     * @cfg {String} defaultText
     * The default {@link #text} value.  This will be used anytime the status bar is cleared with the
     * <tt>useDefaults:true</tt> option (defaults to '').
     */
    /**
     * @cfg {String} defaultIconCls
     * The default {@link #iconCls} value (see the iconCls docs for additional details about customizing the icon).
     * This will be used anytime the status bar is cleared with the <tt>useDefaults:true</tt> option (defaults to '').
     */
    /**
     * @cfg {String} text
     * A string that will be <b>initially</b> set as the status message.  This string
     * will be set as innerHTML (html tags are accepted) for the toolbar item.
     * If not specified, the value set for <code>{@link #defaultText}</code>
     * will be used.
     */
    /**
     * @cfg {String} iconCls
     * A CSS class that will be <b>initially</b> set as the status bar icon and is
     * expected to provide a background image (defaults to '').
     * Example usage:<pre><code>
// Example CSS rule:
.x-statusbar .x-status-custom {
    padding-left: 25px;
    background: transparent url(images/custom-icon.gif) no-repeat 3px 2px;
}

// Setting a default icon:
var sb = Ext.create('Ext.ux.StatusBar', {
    defaultIconCls: 'x-status-custom'
});

// Changing the icon:
sb.setStatus({
    text: 'New status',
    iconCls: 'x-status-custom'
});
</code></pre>
     */

    /**
     * @cfg {String} cls
     * The base class applied to the containing element for this component on render (defaults to 'x-statusbar')
     */
    cls : 'x-statusbar',
    /**
     * @cfg {String} busyIconCls
     * The default <code>{@link #iconCls}</code> applied when calling
     * <code>{@link #showBusy}</code> (defaults to <tt>'x-status-busy'</tt>).
     * It can be overridden at any time by passing the <code>iconCls</code>
     * argument into <code>{@link #showBusy}</code>.
     */
    busyIconCls : 'x-status-busy',
    /**
     * @cfg {String} busyText
     * The default <code>{@link #text}</code> applied when calling
     * <code>{@link #showBusy}</code> (defaults to <tt>'Loading...'</tt>).
     * It can be overridden at any time by passing the <code>text</code>
     * argument into <code>{@link #showBusy}</code>.
     */
    busyText : 'Loading...',
    /**
     * @cfg {Number} autoClear
     * The number of milliseconds to wait after setting the status via
     * <code>{@link #setStatus}</code> before automatically clearing the status
     * text and icon (defaults to <tt>5000</tt>).  Note that this only applies
     * when passing the <tt>clear</tt> argument to <code>{@link #setStatus}</code>
     * since that is the only way to defer clearing the status.  This can
     * be overridden by specifying a different <tt>wait</tt> value in
     * <code>{@link #setStatus}</code>. Calls to <code>{@link #clearStatus}</code>
     * always clear the status bar immediately and ignore this value.
     */
    autoClear : 5000,

    /**
     * @cfg {String} emptyText
     * The text string to use if no text has been set.  Defaults to
     * <tt>'&nbsp;'</tt>).  If there are no other items in the toolbar using
     * an empty string (<tt>''</tt>) for this value would end up in the toolbar
     * height collapsing since the empty string will not maintain the toolbar
     * height.  Use <tt>''</tt> if the toolbar should collapse in height
     * vertically when no text is specified and there are no other items in
     * the toolbar.
     */
    emptyText : '&nbsp;',

    // private
    activeThreadId : 0,

    // private
    initComponent : function(){
        if (this.statusAlign === 'right') {
            this.cls += ' x-status-right';
        }
        this.callParent(arguments);
    },

    // private
    afterRender : function(){
        this.callParent(arguments);

        var right = this.statusAlign === 'right';
        this.currIconCls = this.iconCls || this.defaultIconCls;
        this.statusEl = Ext.create('Ext.toolbar.TextItem', {
            cls: 'x-status-text ' + (this.currIconCls || ''),
            text: this.text || this.defaultText || ''
        });

        if (right) {
            this.add('->');
            this.add(this.statusEl);
        } else {
            this.insert(0, this.statusEl);
            this.insert(1, '->');
        }
        this.height = 27;
        this.doLayout();
    },

    /**
     * Sets the status {@link #text} and/or {@link #iconCls}. Also supports automatically clearing the
     * status that was set after a specified interval.
     * @param {Object/String} config A config object specifying what status to set, or a string assumed
     * to be the status text (and all other options are defaulted as explained below). A config
     * object containing any or all of the following properties can be passed:<ul>
     * <li><tt>text</tt> {String} : (optional) The status text to display.  If not specified, any current
     * status text will remain unchanged.</li>
     * <li><tt>iconCls</tt> {String} : (optional) The CSS class used to customize the status icon (see
     * {@link #iconCls} for details). If not specified, any current iconCls will remain unchanged.</li>
     * <li><tt>clear</tt> {Boolean/Number/Object} : (optional) Allows you to set an internal callback that will
     * automatically clear the status text and iconCls after a specified amount of time has passed. If clear is not
     * specified, the new status will not be auto-cleared and will stay until updated again or cleared using
     * {@link #clearStatus}. If <tt>true</tt> is passed, the status will be cleared using {@link #autoClear},
     * {@link #defaultText} and {@link #defaultIconCls} via a fade out animation. If a numeric value is passed,
     * it will be used as the callback interval (in milliseconds), overriding the {@link #autoClear} value.
     * All other options will be defaulted as with the boolean option.  To customize any other options,
     * you can pass an object in the format:<ul>
     *    <li><tt>wait</tt> {Number} : (optional) The number of milliseconds to wait before clearing
     *    (defaults to {@link #autoClear}).</li>
     *    <li><tt>anim</tt> {Number} : (optional) False to clear the status immediately once the callback
     *    executes (defaults to true which fades the status out).</li>
     *    <li><tt>useDefaults</tt> {Number} : (optional) False to completely clear the status text and iconCls
     *    (defaults to true which uses {@link #defaultText} and {@link #defaultIconCls}).</li>
     * </ul></li></ul>
     * Example usage:<pre><code>
// Simple call to update the text
statusBar.setStatus('New status');

// Set the status and icon, auto-clearing with default options:
statusBar.setStatus({
    text: 'New status',
    iconCls: 'x-status-custom',
    clear: true
});

// Auto-clear with custom options:
statusBar.setStatus({
    text: 'New status',
    iconCls: 'x-status-custom',
    clear: {
        wait: 8000,
        anim: false,
        useDefaults: false
    }
});
</code></pre>
     * @return {Ext.ux.StatusBar} this
     */
    setStatus : function(o) {
        o = o || {};

        if (Ext.isString(o)) {
            o = {text:o};
        }
        if (o.text !== undefined) {
            this.setText(o.text);
        }
        if (o.iconCls !== undefined) {
            this.setIcon(o.iconCls);
        }

        if (o.clear) {
            var c = o.clear,
                wait = this.autoClear,
                defaults = {useDefaults: true, anim: true};

            if (Ext.isObject(c)) {
                c = Ext.applyIf(c, defaults);
                if (c.wait) {
                    wait = c.wait;
                }
            } else if (Ext.isNumber(c)) {
                wait = c;
                c = defaults;
            } else if (Ext.isBoolean(c)) {
                c = defaults;
            }

            c.threadId = this.activeThreadId;
            Ext.defer(this.clearStatus, wait, this, [c]);
        }
        this.doLayout();
        return this;
    },

    /**
     * Clears the status {@link #text} and {@link #iconCls}. Also supports clearing via an optional fade out animation.
     * @param {Object} config (optional) A config object containing any or all of the following properties.  If this
     * object is not specified the status will be cleared using the defaults below:<ul>
     * <li><tt>anim</tt> {Boolean} : (optional) True to clear the status by fading out the status element (defaults
     * to false which clears immediately).</li>
     * <li><tt>useDefaults</tt> {Boolean} : (optional) True to reset the text and icon using {@link #defaultText} and
     * {@link #defaultIconCls} (defaults to false which sets the text to '' and removes any existing icon class).</li>
     * </ul>
     * @return {Ext.ux.StatusBar} this
     */
    clearStatus : function(o) {
        o = o || {};

        if (o.threadId && o.threadId !== this.activeThreadId) {
            // this means the current call was made internally, but a newer
            // thread has set a message since this call was deferred.  Since
            // we don't want to overwrite a newer message just ignore.
            return this;
        }

        var text = o.useDefaults ? this.defaultText : this.emptyText,
            iconCls = o.useDefaults ? (this.defaultIconCls ? this.defaultIconCls : '') : '';

        if (o.anim) {
            // animate the statusEl Ext.Element
            this.statusEl.el.puff({
                remove: false,
                useDisplay: true,
                scope: this,
                callback: function(){
                    this.setStatus({
                     text: text,
                     iconCls: iconCls
                 });

                    this.statusEl.el.show();
                }
            });
        } else {
            // hide/show the el to avoid jumpy text or icon
             this.statusEl.hide();
             this.setStatus({
                 text: text,
                 iconCls: iconCls
             });
             this.statusEl.show();
        }
        this.doLayout();
        return this;
    },

    /**
     * Convenience method for setting the status text directly.  For more flexible options see {@link #setStatus}.
     * @param {String} text (optional) The text to set (defaults to '')
     * @return {Ext.ux.StatusBar} this
     */
    setText : function(text){
        this.activeThreadId++;
        this.text = text || '';
        if (this.rendered) {
            this.statusEl.setText(this.text);
        }
        return this;
    },

    /**
     * Returns the current status text.
     * @return {String} The status text
     */
    getText : function(){
        return this.text;
    },

    /**
     * Convenience method for setting the status icon directly.  For more flexible options see {@link #setStatus}.
     * See {@link #iconCls} for complete details about customizing the icon.
     * @param {String} iconCls (optional) The icon class to set (defaults to '', and any current icon class is removed)
     * @return {Ext.ux.StatusBar} this
     */
    setIcon : function(cls){
        this.activeThreadId++;
        cls = cls || '';

        if (this.rendered) {
         if (this.currIconCls) {
             this.statusEl.removeCls(this.currIconCls);
             this.currIconCls = null;
         }
         if (cls.length > 0) {
             this.statusEl.addCls(cls);
             this.currIconCls = cls;
         }
        } else {
            this.currIconCls = cls;
        }
        return this;
    },

    /**
     * Convenience method for setting the status text and icon to special values that are pre-configured to indicate
     * a "busy" state, usually for loading or processing activities.
     * @param {Object/String} config (optional) A config object in the same format supported by {@link #setStatus}, or a
     * string to use as the status text (in which case all other options for setStatus will be defaulted).  Use the
     * <tt>text</tt> and/or <tt>iconCls</tt> properties on the config to override the default {@link #busyText}
     * and {@link #busyIconCls} settings. If the config argument is not specified, {@link #busyText} and
     * {@link #busyIconCls} will be used in conjunction with all of the default options for {@link #setStatus}.
     * @return {Ext.ux.StatusBar} this
     */
    showBusy : function(o){
        if (Ext.isString(o)) {
            o = { text: o };
        }
        o = Ext.applyIf(o || {}, {
            text: this.busyText,
            iconCls: this.busyIconCls
        });
        return this.setStatus(o);
    }
});


Ext.define('PartKeepr.Statusbar', {
	extend: 'Ext.ux.statusbar.StatusBar',
	
	defaultText: i18n("Ready."),
	defaultIconCls: 'x-status-valid',
	iconCls: 'x-status-valid',
	autoClear: 3000,
	initComponent: function () {
		
		this.connectionButton = new PartKeepr.ConnectionButton();
		this.connectionButton.on("click", this.onConnectionButtonClick, this);
		this.timeDisplay = new PartKeepr.TimeDisplay();
		this.currentUserDisplay = Ext.create("Ext.toolbar.TextItem");
		
		this.currentUserDisplay.setText(i18n("Not logged in"));
		
		this.showMessageLog = Ext.create("Ext.Button",{
			icon: 'resources/silkicons/application_osx_terminal.png',
			cls: 'x-btn-icon',
			handler: function () {
				PartKeepr.getApplication().toggleMessageLog();
			}
		});
		
		this.systemNoticeButton = Ext.create("PartKeepr.SystemNoticeButton", {
			hidden: true
		});
		
		Ext.apply(this, {
			items: [
			        this.currentUserDisplay,
			        {xtype: 'tbseparator'},
			        this.timeDisplay,
			        { xtype: 'tbseparator' },
			        this.showMessageLog,
			        { xtype: 'tbseparator' },
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
		this.currentUserDisplay.setText(i18n("Logged in as")+": "+username);
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
		if (PartKeepr.getApplication().getSession()) {
			PartKeepr.getApplication().logout();
		} else {
			var o = new PartKeepr.LoginDialog();
	    	o.show();
		}
	}
});



/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.ux.TabCloseMenu
 * Plugin (ptype = 'tabclosemenu') for adding a close context menu to tabs. Note that the menu respects
 * the closable configuration on the tab. As such, commands like remove others and remove all will not
 * remove items that are not closable.
 *
 * @constructor
 * @param {Object} config The configuration options
 * @ptype tabclosemenu
 */
Ext.define('Ext.tab.TabCloseMenu', {
    alias: 'plugin.tabclosemenu',
    alternateClassName: 'Ext.ux.TabCloseMenu',

    mixins: {
        observable: 'Ext.util.Observable'
    },

    /**
     * @cfg {String} closeTabText
     * The text for closing the current tab. Defaults to <tt>'Close Tab'</tt>.
     */
    closeTabText: 'Close Tab',

    /**
     * @cfg {Boolean} showCloseOthers
     * Indicates whether to show the 'Close Others' option. Defaults to <tt>true</tt>.
     */
    showCloseOthers: true,

    /**
     * @cfg {String} closeOtherTabsText
     * The text for closing all tabs except the current one. Defaults to <tt>'Close Other Tabs'</tt>.
     */
    closeOthersTabsText: 'Close Other Tabs',

    /**
     * @cfg {Boolean} showCloseAll
     * Indicates whether to show the 'Close All' option. Defaults to <tt>true</tt>.
     */
    showCloseAll: true,

    /**
     * @cfg {String} closeAllTabsText
     * <p>The text for closing all tabs. Defaults to <tt>'Close All Tabs'</tt>.
     */
    closeAllTabsText: 'Close All Tabs',

    /**
     * @cfg {Array} extraItemsHead
     * An array of additional context menu items to add to the front of the context menu.
     */
    extraItemsHead: null,

    /**
     * @cfg {Array} extraItemsTail
     * An array of additional context menu items to add to the end of the context menu.
     */
    extraItemsTail: null,

    //public
    constructor: function (config) {
        this.addEvents(
            'aftermenu',
            'beforemenu');

        this.mixins.observable.constructor.call(this, config);
    },

    init : function(tabpanel){
        this.tabPanel = tabpanel;
        this.tabBar = tabpanel.down("tabbar");

        this.mon(this.tabPanel, {
            scope: this,
            afterlayout: this.onAfterLayout,
            single: true
        });
    },

    onAfterLayout: function() {
        this.mon(this.tabBar.el, {
            scope: this,
            contextmenu: this.onContextMenu,
            delegate: 'div.x-tab'
        });
    },

    onBeforeDestroy : function(){
        Ext.destroy(this.menu);
        this.callParent(arguments);
    },

    // private
    onContextMenu : function(event, target){
        var me = this,
            menu = me.createMenu(),
            disableAll = true,
            disableOthers = true,
            tab = me.tabBar.getChildByElement(target),
            index = me.tabBar.items.indexOf(tab);

        me.item = me.tabPanel.getComponent(index);
        menu.child('*[text="' + me.closeTabText + '"]').setDisabled(!me.item.closable);

        if (me.showCloseAll || me.showCloseOthers) {
            me.tabPanel.items.each(function(item) {
                if (item.closable) {
                    disableAll = false;
                    if (item != me.item) {
                        disableOthers = false;
                        return false;
                    }
                }
                return true;
            });

            if (me.showCloseAll) {
                menu.child('*[text="' + me.closeAllTabsText + '"]').setDisabled(disableAll);
            }

            if (me.showCloseOthers) {
                menu.child('*[text="' + me.closeOthersTabsText + '"]').setDisabled(disableOthers);
            }
        }

        event.preventDefault();
        me.fireEvent('beforemenu', menu, me.item, me);

        menu.showAt(event.getXY());
    },

    createMenu : function() {
        var me = this;

        if (!me.menu) {
            var items = [{
                text: me.closeTabText,
                scope: me,
                handler: me.onClose
            }];

            if (me.showCloseAll || me.showCloseOthers) {
                items.push('-');
            }

            if (me.showCloseOthers) {
                items.push({
                    text: me.closeOthersTabsText,
                    scope: me,
                    handler: me.onCloseOthers
                });
            }

            if (me.showCloseAll) {
                items.push({
                    text: me.closeAllTabsText,
                    scope: me,
                    handler: me.onCloseAll
                });
            }

            if (me.extraItemsHead) {
                items = me.extraItemsHead.concat(items);
            }

            if (me.extraItemsTail) {
                items = items.concat(me.extraItemsTail);
            }

            me.menu = Ext.create('Ext.menu.Menu', {
                items: items,
                listeners: {
                    hide: me.onHideMenu,
                    scope: me
                }
            });
        }

        return me.menu;
    },

    onHideMenu: function () {
        var me = this;

        me.item = null;
        me.fireEvent('aftermenu', me.menu, me);
    },

    onClose : function(){
        this.tabPanel.remove(this.item);
    },

    onCloseOthers : function(){
        this.doClose(true);
    },

    onCloseAll : function(){
        this.doClose(false);
    },

    doClose : function(excludeActive){
        var items = [];

        this.tabPanel.items.each(function(item){
            if(item.closable){
                if(!excludeActive || item != this.item){
                    items.push(item);
                }
            }
        }, this);

        Ext.each(items, function(item){
            this.tabPanel.remove(item);
        }, this);
    }
});


