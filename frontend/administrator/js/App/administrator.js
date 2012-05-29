Ext.namespace("Administrator");
Ext.Loader.setConfig({
    enabled : true,
    paths   : {
        'Administrator' : 'frontend/administrator/js/App',
        'Ext' : 'frontend/administrator/js/ExtJS',
        'Ext.ux' : 'frontend/administrator/js/Ext.ux'
    } 
});

Administrator.application = null;
Administrator.basePath = null;
Administrator.resourcePath = null;
Administrator.resourcePath = window.parameters.baseResource;
Ext.application({
    name: "Administrator",
    appFolder: "frontend/administrator/js/App",
    launch: function () {
    	Ext.setLocale("en_US");
        Ext.get("loading").hide();
        this.createLayout();
        Administrator.application = this;
        Administrator.setBasePath(window.parameters.basePath);
        Administrator.setResourcePath(window.parameters.baseResource);
        this.sessionManager = new Administrator.SessionManager();
        if (window.parameters.auto_start_session) {
            this.getSessionManager().setSession(window.parameters.auto_start_session);
            this.getStatusbar().connectionButton.hide();
            this.onLogin()
        } else {
            this.sessionManager.on("login", this.onLogin, this);
            this.sessionManager.login();
        }
        Ext.fly(document.body).on("contextmenu", this.onContextMenu, this)
    },
    
    onContextMenu: function (b, a) {
        b.preventDefault()
    },
    
    onLogin: function () {
        this.createGlobalStores();
        this.reloadStores();
        var a = Ext.create("Administrator.Dashboard", {
            title: "Dashboard",
            iconCls: "icon-brick",
            closable: false
        });
        this.addItem(a);
        this.menuBar.enable();
        this.doSystemStatusCheck();
        this.doUnacknowledgedNoticesCheck();
        this.setSession(this.getSessionManager().getSession());
        this.getStatusbar().getConnectionButton().setConnected()
    },
    
    doSystemStatusCheck: function () {
        var a = new Administrator.Util.ServiceCall("System", "getSystemStatus");
        a.setHandler(Ext.bind(this.onSystemStatusCheck, this));
        a.doCall()
    },
    
    onSystemStatusCheck: function (a) {
        if (a.data.schemaStatus !== "complete") {
            alert(i18n("Your database schema is not up-to-date! Please re-run setup immediately!"))
        }
        if (a.data.inactiveCronjobCount > 0) {
            alert(i18n("The following cronjobs aren't running:") + "\n\n" + a.data.inactiveCronjobs.join("\n"))
        }
    },
    
    getSessionManager: function () {
        return this.sessionManager
    },
    
    doUnacknowledgedNoticesCheck: function () {
        var a = new Administrator.Util.ServiceCall("SystemNotice", "hasUnacknowledgedNotices");
        a.setHandler(Ext.bind(this.onUnacknowledgedNoticesCheck, this));
        a.doCall()
    },
    
    onUnacknowledgedNoticesCheck: function (a) {
        if (a.data.unacknowledgedNotices === true) {
            this.statusBar.systemNoticeButton.show()
        } else {
            this.statusBar.systemNoticeButton.hide()
        }
        Ext.defer(this.doUnacknowledgedNoticesCheck, 10000, this)
    },
    
    logout: function () {
        this.menuBar.disable();
        this.centerPanel.removeAll(true);
        this.getSessionManager.logout()
    },
    
    createGlobalStores: function () {
        this.userStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.User",
            pageSize: -1,
            autoLoad: false
        });
    },
    
    storeLoaded: function (a) {
        a._loaded = true
    },
    
    setAdmin: function (a) {
        this.admin = a
    },
    
    isAdmin: function () {
        return this.admin
    },
    
    getUserStore: function () {
        return this.userStore
    },
    
    getSiPrefixStore: function () {
        return this.siPrefixStore
    },
    
    convertMicroToMu: function (a) {
        return str_replace("�", "�", a)
    },
    
    reloadStores: function () {
        if (this.getSessionManager().getSession()) {
            this.userStore.load();
            Ext.defer(Administrator.getApplication().reloadStores, 100000, this)
        }
    },
    
    createLayout: function () {
        this.statusBar = Ext.create("Administrator.Components.Statusbar");
        this.messageLog = this.createMessageLog();
        this.centerPanel = Ext.create("Ext.tab.Panel", {
            xtype: "tabpanel",
            border: false,
            region: "center",
            bodyStyle: "background:#DBDBDB",
            plugins: Ext.create("Ext.ux.TabCloseMenu")
        });
        this.menuBar = Ext.create("Administrator.MenuBar");
        this.menuBar.disable();
        Ext.create("Ext.container.Viewport", {
            layout: "fit",
            items: [{
                xtype: "panel",
                border: false,
                layout: "border",
                items: [this.centerPanel, this.messageLog],
                bbar: this.statusBar,
                tbar: this.menuBar
            }]
        })
    },
    
    addItem: function (a) {
        this.centerPanel.add(a)
    },
    
    createMessageLog: function () {
        return Ext.create("Administrator.MessageLog", {
            height: 200,
            hidden: true,
            split: true,
            title: "Message Log",
            titleCollapse: true,
            collapsible: true,
            region: "south",
            listeners: {
                beforecollapse: Ext.bind(function (a) {
                    this.hideMessageLog();
                    return false
                }, this)
            }
        })
    },
    
    log: function (a) {
        this.logMessage(a, "none")
    },
    
    logMessage: function (c, a) {
        if (c != "Ready.") {
            var b = Ext.ModelManager.create({
                message: c,
                severity: a,
                date: new Date()
            }, "Administrator.Message");
            this.messageLog.getStore().add(b)
        }
    },
    
    hideMessageLog: function () {
        this.messageLog.hide()
    },
    
    showMessageLog: function () {
        this.messageLog.show()
    },
    
    toggleMessageLog: function () {
        if (this.messageLog.isHidden()) {
            this.showMessageLog()
        } else {
            this.hideMessageLog()
        }
    },
    
    getStatusbar: function () {
        return this.statusBar
    },
    
    getSession: function () {
        return this.getSessionManager().getSession()
    },
    
    setSession: function (a) {
        if (a) {
            this.getStatusbar().getConnectionButton().setConnected()
        } else {
            this.getStatusbar().getConnectionButton().setDisconnected();
            this.setUsername("")
        }
    },
    
    setUsername: function (a) {
        this.username = a;
        this.getStatusbar().setCurrentUser(a)
    },
    
    getUsername: function () {
        return this.username
    }
});

Ext.locales = {
    de_DE: {
        flag: "de",
        name: "Deutsch (Deutschland)",
        dateformat: "d.m.Y H:i:s T"
    },
    en_US: {
        flag: "us",
        name: "English (USA)",
        dateformat: "n/j/Y H:i:s T"
    }
};

Ext.setLocale = function (a) {
    Ext.jm_locale = a
};

Ext.getLocale = function () {
    return Ext.jm_locale
};

Ext.getLocaleFlag = function () {
    return Ext.locales[Ext.jm_locale].flag
};

Ext.getDateFormat = function () {
    return Ext.locales[Ext.jm_locale].dateformat
};	