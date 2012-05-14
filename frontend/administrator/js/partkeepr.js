function i18n(a) {
    return a
}
Ext.define("PartKeepr.JsonWithAssociations", {
    extend: "Ext.data.writer.Json",
    alias: "writer.jsonwithassociations",
    associations: [],
    getRecordData: function (a) {
        var f = this,
            e, d, b, g = f.callParent(arguments);
        var c;
        Ext.apply(g, a.getAssociatedData());
        return g
    }
});
Ext.namespace("PartKeepr");
Ext.Loader.setPath({
    PartKeepr: "js"
});
PartKeepr.application = null;
PartKeepr.basePath = null;
Ext.application({
    name: "PartKeepr",
    launch: function () {
        Ext.get("loading").hide();
        Ext.setLocale("en_US");
        this.createLayout();
        PartKeepr.application = this;
        PartKeepr.setBasePath(window.parameters.basePath);
        PartKeepr.setMaxUploadSize(window.parameters.maxUploadSize);
        PartKeepr.setAvailableImageFormats(window.parameters.availableImageFormats);
        this.sessionManager = new PartKeepr.SessionManager();
        if (window.parameters.auto_start_session) {
            this.getSessionManager().setSession(window.parameters.auto_start_session);
            this.getStatusbar().connectionButton.hide();
            this.onLogin()
        } else {
            this.sessionManager.on("login", this.onLogin, this);
            if (window.parameters.autoLoginUsername) {
                this.sessionManager.login(window.parameters.autoLoginUsername, window.parameters.autoLoginPassword)
            } else {
                this.sessionManager.login()
            }
        }
        Ext.fly(document.body).on("contextmenu", this.onContextMenu, this)
    },
    
    onContextMenu: function (b, a) {
        b.preventDefault()
    },
    
    onLogin: function () {
        this.createGlobalStores();
        this.reloadStores();
        var a = Ext.create("PartKeepr.PartManager", {
            title: i18n("Part Manager"),
            iconCls: "icon-brick",
            closable: false
        });
        this.addItem(a);
        this.menuBar.enable();
        this.doSystemStatusCheck();
        this.doUnacknowledgedNoticesCheck();
        //this.displayTipWindowTask = new Ext.util.DelayedTask(this.displayTipOfTheDayWindow, this);
        //this.displayTipWindowTask.delay(100);
        this.setSession(this.getSessionManager().getSession());
        this.getStatusbar().getConnectionButton().setConnected()
    },
    
    displayTipOfTheDayWindow: function () {
        if (!this.userPreferenceStore._loaded) {
            this.displayTipWindowTask.delay(100);
            return
        }
        if (!this.tipOfTheDayStore._loaded) {
            this.displayTipWindowTask.delay(100);
            return
        }
        if (PartKeepr.getApplication().getUserPreference("partkeepr.tipoftheday.showtips") !== false) {
            var a = Ext.create("PartKeepr.TipOfTheDayWindow");
            if (a.getLastUnreadTip() !== null) {
                a.show()
            }
        }
    },
    
    doSystemStatusCheck: function () {
        var a = new PartKeepr.ServiceCall("System", "getSystemStatus");
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
        var a = new PartKeepr.ServiceCall("SystemNotice", "hasUnacknowledgedNotices");
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
        this.footprintStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.Footprint",
            pageSize: -1,
            autoLoad: false
        });
        this.siPrefixStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.SiPrefix",
            pageSize: -1,
            autoLoad: true
        });
        this.distributorStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.Distributor",
            pageSize: -1,
            autoLoad: false
        });
        this.manufacturerStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.Manufacturer",
            pageSize: -1,
            autoLoad: false
        });
        this.partUnitStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.PartUnit",
            pageSize: -1,
            autoLoad: false
        });
        this.unitStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.Unit",
            pageSize: -1,
            autoLoad: false
        });
        this.userStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.User",
            pageSize: -1,
            autoLoad: false
        });
        this.tipOfTheDayStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.TipOfTheDay",
            pageSize: -1,
            autoLoad: true,
            listeners: {
                scope: this,
                load: this.storeLoaded
            }
        });
        this.userPreferenceStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.UserPreference",
            pageSize: -1,
            autoLoad: true,
            listeners: {
                scope: this,
                load: this.storeLoaded
            }
        })
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
    
    getTipOfTheDayStore: function () {
        return this.tipOfTheDayStore
    },
    
    getUserPreference: function (b) {
        var a = this.userPreferenceStore.findRecord("key", b);
        if (a) {
            return a.get("value")
        } else {
            return null
        }
    },
    
    setUserPreference: function (c, d) {
        var a = this.userPreferenceStore.findRecord("key", c);
        if (a) {
            a.set("value", d)
        } else {
            var b = new PartKeepr.UserPreference();
            b.set("key", c);
            b.set("value", d);
            this.userPreferenceStore.add(b)
        }
        this.userPreferenceStore.sync()
    },
    
    getUserPreferenceStore: function () {
        return this.userPreferenceStore
    },
    
    getUnitStore: function () {
        return this.unitStore
    },
    
    getPartUnitStore: function () {
        return this.partUnitStore
    },
    
    getFootprintStore: function () {
        return this.footprintStore
    },
    
    getManufacturerStore: function () {
        return this.manufacturerStore
    },
    
    getDistributorStore: function () {
        return this.distributorStore
    },
    
    getDefaultPartUnit: function () {
        return this.partUnitStore.findRecord("default", true)
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
            this.footprintStore.load();
            this.manufacturerStore.load();
            this.distributorStore.load();
            this.partUnitStore.load();
            this.unitStore.load();
            this.userStore.load();
            Ext.defer(PartKeepr.getApplication().reloadStores, 100000, this)
        }
    },
    
    createLayout: function () {
        this.statusBar = Ext.create("PartKeepr.Statusbar");
        this.messageLog = this.createMessageLog();
        this.centerPanel = Ext.create("Ext.tab.Panel", {
            xtype: "tabpanel",
            border: false,
            region: "center",
            bodyStyle: "background:#DBDBDB",
            plugins: Ext.create("Ext.ux.TabCloseMenu")
        });
        this.menuBar = Ext.create("PartKeepr.MenuBar");
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
        return Ext.create("PartKeepr.MessageLog", {
            height: 200,
            hidden: true,
            split: true,
            title: i18n("Message Log"),
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
        if (c != i18n("Ready.")) {
            var b = Ext.ModelManager.create({
                message: c,
                severity: a,
                date: new Date()
            }, "PartKeepr.Message");
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


PartKeepr.getRESTProxy = function (a) {
    var b;
    var c = {
        batchActions: false,
        url: PartKeepr.getBasePath() + "/" + a,
        listeners: {
            exception: function (h, e, d) {
                try {
                    var i = Ext.decode(e.responseText);
                    b = {
                        response: e.responseText
                    };
                    PartKeepr.ExceptionWindow.showException(i.exception, b)
                } catch (g) {
                    var f = {
                        message: i18n("Critical Error"),
                        detail: i18n("The server returned a response which we were not able to interpret.")
                    };
                    b = {
                        response: e.responseText
                    };
                    PartKeepr.ExceptionWindow.showException(f, b)
                }
            }
        },
        reader: {
            type: "json",
            root: "response.data",
            successProperty: "success",
            messageProperty: "message",
            totalProperty: "response.totalCount"
        },
        writer: {
            type: "jsonwithassociations"
        }
    };
    return new Ext.data.proxy.Rest(c)
};

PartKeepr.getSession = function () {
    alert("This should not be called.");
    return "hli2ong0ktnise68p9f5nu6nk1"
};

PartKeepr.log = function (a) {
    PartKeepr.getApplication().log(a)
};

PartKeepr.getApplication = function () {
    return PartKeepr.application
};

PartKeepr.setBasePath = function (a) {
	PartKeepr.basePath = a;
}

PartKeepr.getBasePath = function () {
    return PartKeepr.basePath;
    //return window.parameters.basePath;
};

PartKeepr.getImagePath = function () {
    return "image.php"
};

PartKeepr.setMaxUploadSize = function (a) {
    PartKeepr.maxUploadSize = a
};

PartKeepr.getMaxUploadSize = function () {
    return PartKeepr.maxUploadSize
};

PartKeepr.bytesToSize = function (a) {
    var c = ["Bytes", "KB", "MB", "GB", "TB"];
    if (a === 0) {
        return "n/a"
    }
    var b = parseInt(Math.floor(Math.log(a) / Math.log(1024)), 10);
    return Math.round(a / Math.pow(1024, b), 2) + " " + c[b]
};

PartKeepr.setAvailableImageFormats = function (a) {
    PartKeepr.imageFormats = a
};

PartKeepr.getAvailableImageFormats = function () {
    return PartKeepr.imageFormats
};

PartKeepr.serializeRecords = function (b) {
    var a = [];
    for (var c = 0; c < b.length; c++) {
        a.push(b[c].data)
    }
    return a
};

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

Ext.define("PartKeepr.RememberChoiceMessageBox", {
    extend: "Ext.window.MessageBox",
    escButtonAction: null,
    initComponent: function () {
        this.callParent();
        this.rememberChoiceCheckbox = Ext.create("Ext.form.field.Checkbox", {
            margin: {
                top: "10px"
            },
            boxLabel: i18n("Don't ask again")
        });
        this.topContainer.add(this.rememberChoiceCheckbox)
    },
    onEsc: function () {
        if (this.escButtonAction !== null) {
            var a;
            switch (this.escButtonAction) {
            case "ok":
                a = 0;
                break;
            case "yes":
                a = 1;
                break;
            case "no":
                a = 2;
                break;
            case "cancel":
                a = 3;
                break;
            default:
                a = 3;
                break
            }
            this.btnCallback(this.msgButtons[a])
        } else {
            this.callParent()
        }
    }
});

Ext.define("PartKeepr.FileUploadDialog", {
    extend: "Ext.window.Window",
    title: i18n("File Upload"),
    fileFieldLabel: i18n("File"),
    uploadButtonText: i18n("Select File..."),
    uploadURL: PartKeepr.getBasePath() + "/TempFile",
    layout: "fit",
    resizable: false,
    modal: true,
    iconCls: "icon-drive-upload",
    initComponent: function () {
        if (this.imageUpload) {
            this.uploadURL = PartKeepr.getBasePath() + "/TempImage"
        }
        this.addEvents("fileUploaded");
        this.uploadButton = Ext.create("Ext.button.Button", {
            text: i18n("Upload"),
            iconCls: "icon-drive-upload",
            width: 120,
            handler: Ext.bind(function () {
                var b = this.form.getForm();
                var a = b.getValues();
                if (this.fileField.getValue() === "" && this.urlField.getValue() === "") {
                    Ext.Msg.alert(i18n("Error"), i18n("Please select a file to upload or enter an URL"));
                    return
                }
                if (b.isValid()) {
                    b.submit({
                        url: this.uploadURL,
                        params: {
                            call: "upload",
                            session: PartKeepr.getApplication().getSession()
                        },
                        success: Ext.bind(function (c, d) {
                            this.fireEvent("fileUploaded", d.result.response);
                            this.close()
                        }, this),
                        failure: function (c, e) {
                            var d = Ext.decode(e.response.responseText);
                            request = {
                                response: e.response.responseText
                            };
                            PartKeepr.ExceptionWindow.showException(d.exception, request)
                        }
                    })
                }
            }, this)
        });
        this.urlField = Ext.create("Ext.form.field.Text", {
            fieldLabel: i18n("URL"),
            labelWidth: 50,
            name: "url",
            anchor: "100%"
        });
        this.tbButtons = [this.uploadButton];
        if (this.imageUpload) {
            this.title = i18n("Image Upload");
            this.fileFieldLabel = i18n("Image");
            this.uploadButtonText = i18n("Select Image...");
            this.fileFormatButton = Ext.create("Ext.button.Button", {
                text: i18n("Available Formats"),
                width: 120,
                iconCls: "icon-infocard",
                handler: this.showAvailableFormats,
                scope: this
            });
            this.tbButtons.push(this.fileFormatButton)
        }
        this.fileField = Ext.create("Ext.form.field.File", {
            xtype: "filefield",
            name: "userfile",
            fieldLabel: this.fileFieldLabel,
            labelWidth: 50,
            msgTarget: "side",
            anchor: "100%",
            buttonText: this.uploadButtonText
        });
        this.form = Ext.create("Ext.form.Panel", {
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
                style: "margin-bottom: 10px;",
                border: false
            },
            this.urlField],
            buttons: this.tbButtons
        });
        this.on("beforedestroy", this.onBeforeDestroy, this);
        this.items = this.form;
        this.callParent()
    },
    showAvailableFormats: function () {
        if (!this.tip) {
            this.tip = Ext.create("Ext.tip.ToolTip", {
                title: i18n("Available Image Formats"),
                anchor: "left",
                width: 200,
                height: 300,
                autoScroll: true,
                target: this.fileFormatButton.getEl(),
                closable: true,
                html: implode("<br>", PartKeepr.getAvailableImageFormats()),
                autoHide: false
            })
        }
        this.tip.show()
    },
    onBeforeDestroy: function () {
        if (this.tip) {
            this.tip.destroy()
        }
    }
});

Ext.define("PartKeepr.ExceptionWindow", {
    extend: "Ext.window.Window",
    resizable: true,
    layout: "fit",
    width: 500,
    autoHeight: true,
    maxHeight: 800,
    cls: Ext.baseCSSPrefix + "message-box",
    initComponent: function () {
        this.iconComponent = Ext.create("Ext.Component", {
            cls: "ext-mb-icon",
            width: 40,
            height: 35,
            style: {
                "float": "left"
            }
        });
        this.messageDiv = Ext.create("Ext.Component", {
            autoEl: {
                tag: "div"
            },
            cls: "ext-mb-text",
            style: "margin-left: 40px;"
        });
        this.detailDiv = Ext.create("Ext.Component", {
            autoEl: {
                tag: "div"
            },
            cls: "ext-mb-text",
            style: "margin-left: 40px; margin-top: 20px;"
        });
        this.exceptionDetails = Ext.create("Ext.form.field.TextArea", {
            fieldLabel: i18n("Exception Details"),
            flex: 1,
            minHeight: 65,
            readOnly: true
        });
        this.backtraceDetails = Ext.create("Ext.form.field.TextArea", {
            fieldLabel: i18n("Backtrace"),
            flex: 1,
            minHeight: 65,
            readOnly: true
        });
        this.requestDetails = Ext.create("Ext.form.field.TextArea", {
            fieldLabel: i18n("Request"),
            flex: 1,
            minHeight: 65,
            readOnly: true
        });
        this.responseDetails = Ext.create("Ext.form.field.TextArea", {
            fieldLabel: i18n("Response"),
            flex: 1,
            minHeight: 65,
            readOnly: true
        });
        this.basicTab = Ext.create("Ext.panel.Panel", {
            style: "padding: 10px",
            layout: "anchor",
            anchor: "100% 100%",
            title: i18n("Basic"),
            items: [this.iconComponent, this.messageDiv, this.detailDiv]
        });
        this.detailTab = Ext.create("Ext.form.Panel", {
            style: "padding: 10px",
            layout: "anchor",
            autoScroll: true,
            title: i18n("Detail"),
            items: [{
                xtype: "panel",
                height: 300,
                border: false,
                layout: {
                    type: "vbox",
                    align: "stretch",
                    pack: "start"
                },
                items: [this.exceptionDetails, this.backtraceDetails, this.requestDetails, this.responseDetails]
            }]
        });
        this.fullReport = Ext.create("Ext.form.field.TextArea", {
            readOnly: true,
            height: 300
        });
        this.backtraceTab = Ext.create("Ext.panel.Panel", {
            style: "padding: 10px",
            layout: "fit",
            anchor: "100% 100%",
            title: i18n("Full Report"),
            items: [this.fullReport]
        });
        this.topContainer = Ext.create("Ext.tab.Panel", {
            items: [this.basicTab, this.detailTab, this.backtraceTab]
        });
        this.items = this.topContainer;
        this.dockedItems = [{
            xtype: "toolbar",
            dock: "bottom",
            ui: "footer",
            defaults: {
                minWidth: 80
            },
            layout: {
                pack: "center"
            },
            items: [{
                xtype: "button",
                text: "OK",
                handler: Ext.bind(function () {
                    this.hide()
                }, this)
            }]
        }];
        this.callParent()
    },
    setIcon: function (a) {
        this.iconComponent.removeCls(this.iconCls);
        if (a) {
            this.iconComponent.show();
            this.iconComponent.addCls(Ext.baseCSSPrefix + "dlg-icon");
            this.iconComponent.addCls(a)
        } else {
            this.iconComponent.removeCls(Ext.baseCSSPrefix + "dlg-icon");
            this.iconComponent.hide()
        }
    },
    _showException: function (d, b) {
        var e = "==================================";
        this.setIcon(Ext.MessageBox.ERROR);
        this.messageDiv.update(d.message);
        this.setTitle(d.message);
        var c = d.message;
        if (d.detail) {
            c += "\n\n" + i18n("Details") + "\n" + e + "\n";
            c += d.detail;
            this.detailDiv.update(d.detail)
        } else {
            this.detailDiv.update("")
        }
        if (d.exception) {
            c += "\n\n" + i18n("Exception") + "\n" + e + "\n";
            c += d.exception;
            this.exceptionDetails.setValue(d.exception)
        } else {
            this.exceptionDetails.setValue("No information available")
        }
        if (d.backtrace) {
            c += "\n\n" + i18n("Backtrace") + "\n" + e + "\n";
            c += d.exception;
            this.backtraceDetails.setValue(nl2br(d.backtrace))
        } else {
            this.backtraceDetails.setValue("No backtrace available")
        }
        if (b.request) {
            c += "\n\n" + i18n("Request") + "\n" + e + "\n";
            c += b.request;
            this.requestDetails.setValue(nl2br(b.request))
        } else {
            this.requestDetails.setValue("No server request information available")
        }
        if (b.response) {
            c += "\n\n" + i18n("Response") + "\n" + e + "\n";
            c += b.response;
            this.responseDetails.setValue(nl2br(b.response))
        } else {
            this.responseDetails.setValue("No server response information available")
        }
        c += "\n\n" + i18n("Server Configuration") + "\n" + e + "\n";
        for (var a in window.parameters) {
            c += a + ": " + window.parameters[a] + "\n"
        }
        this.fullReport.setValue(c);
        this.show();
        this.topContainer.layout.setActiveItem(0);
        this.doLayout()
    },
    statics: {
        showException: function (b, a) {
            if (!PartKeepr.ExceptionWindow.activeInstance) {
                PartKeepr.ExceptionWindow.activeInstance = new PartKeepr.ExceptionWindow()
            }
            PartKeepr.ExceptionWindow.activeInstance._showException(b, a)
        }
    }
});

Ext.override(Ext.selection.RowModel, {
    onLastFocusChanged: function (c, b, a) {
        if (this.views && this.views.length) {
            this.callOverridden(arguments)
        }
    },
    onSelectChange: function (a, c, b, d) {
        if (this.views && this.views.length) {
            this.callOverridden(arguments)
        }
    }
});

Ext.override(Ext.grid.plugin.CellEditing, {
    startEdit: function (a, f) {
        var d = this,
            e = a.get(f.dataIndex),
            c = d.getEditingContext(a, f),
            b;
        a = c.record;
        f = c.column;
        d.completeEdit();
        c.originalValue = c.value = e;
        if (d.beforeEdit(c) === false || d.fireEvent("beforeedit", c) === false || c.cancel) {
            return false
        }
        if (f && (!f.getEditor || !f.getEditor(a))) {
            return false
        }
        b = d.getEditor(a, f);
        if (b) {
            d.context = c;
            d.setActiveEditor(b);
            d.setActiveRecord(a);
            d.setActiveColumn(f);
            d.editTask.delay(15, b.startEdit, b, [d.getCell(a, f), e])
        } else {
            d.grid.getView().getEl(f).focus((Ext.isWebKit || Ext.isIE) ? 10 : false)
        }
        return true
    }
});


Ext.override(Ext.panel.Table, {
    scrollDelta: 100
});


Ext.override(Ext.grid.feature.Grouping, {
    collapseAll: function () {
        var b = this,
            a = b.view;
        a.el.query(".x-grid-group-hd").forEach(function (d) {
            var c = Ext.fly(d.nextSibling, "_grouping");
            b.collapse(c)
        })
    },
    expandAll: function () {
        var b = this,
            a = b.view;
        a.el.query(".x-grid-group-hd").forEach(function (d) {
            var c = Ext.fly(d.nextSibling, "_grouping");
            b.expand(c)
        })
    }
});


Ext.override(Ext.layout.component.field.Trigger, {
    sizeBodyContents: function (d, b) {
        var e = this,
            a = e.owner,
            g = a.inputEl,
            c = a.triggerWrap,
            f = a.getTriggerWidth();
        if (a.hideTrigger || a.readOnly || f > 0) {
            e.setElementSize(g, Ext.isNumber(d) ? d : d);
            g.dom.style.paddingRight = (f + 2) + "px";
            c.setWidth(f)
        }
    }
});


Ext.override(Ext.data.reader.Json, {
    getResponseData: function (a) {
        var e;
        try {
            e = Ext.decode(a.responseText)
        } catch (c) {
            var b = {
                message: i18n("Critical Error"),
                detail: i18n("The server returned a response which we were not able to interpret.")
            };
            var d = {
                response: a.responseText
            };
            PartKeepr.ExceptionWindow.showException(b, d)
        }
        return e
    }
});


Ext.override(Ext.tree.View, {
    ensureVisible: function (a) {
        if (!a) {
            return
        }
        if (a.parentNode) {
            a.parentNode.expand();
            this.ensureVisible(a.parentNode)
        }
    },
    scrollIntoView: function (a) {
        var b = this.getNode(a);
        if (b) {
            b.scrollIntoView(this.getEl())
        }
    }
});

Ext.override(Ext.data.Connection, {
    setupHeaders: function (f, a, b, e) {
        var c;
        if (!a.headers) {
            a.headers = {}
        }
        if (PartKeepr.getApplication() !== null) {
            c = PartKeepr.getApplication().getSession();
            if (c !== null) {
                a.headers.session = c
            }
        }
        var d = this.callOverridden(arguments);
        return d
    }
});

Ext.define("Ext.ux.form.SearchField", {
    extend: "Ext.form.field.Trigger",
    alias: "widget.searchfield",
    trigger1Cls: Ext.baseCSSPrefix + "form-clear-trigger",
    trigger2Cls: Ext.baseCSSPrefix + "form-search-trigger",
    hasSearch: false,
    paramName: "query",
    initComponent: function () {
        this.callParent(arguments);
        this.on("specialkey", function (a, b) {
            if (b.getKey() == b.ENTER) {
                this.onTrigger2Click()
            }
        }, this)
    },
    afterRender: function () {
        this.callParent();
        this.triggerEl.item(0).setDisplayed("none");
        this.doComponentLayout()
    },
    onTrigger1Click: function () {
        var c = this,
            a = c.store,
            b = a.getProxy(),
            d;
        if (c.hasSearch) {
            c.setValue("");
            b.extraParams[c.paramName] = "";
            a.currentPage = 1;
            a.load({
                start: 0
            });
            c.hasSearch = false;
            c.triggerEl.item(0).setDisplayed("none");
            c.doComponentLayout()
        }
    },
    onTrigger2Click: function () {
        var c = this,
            a = c.store,
            b = a.getProxy(),
            d = c.getValue();
        if (d.length < 1) {
            c.onTrigger1Click();
            return
        }
        b.extraParams[c.paramName] = d;
        a.currentPage = 1;
        a.load({
            start: 0
        });
        c.hasSearch = true;
        c.triggerEl.item(0).setDisplayed("block");
        c.doComponentLayout()
    }
});

Ext.define("Ext.ux.ClearableComboBox", {
    extend: "Ext.form.ComboBox",
    alias: "widget.clearcombo",
    initComponent: function () {
        this.triggerConfig = {
            tag: "span",
            cls: "x-form-twin-triggers",
            cn: [{
                tag: "img",
                src: Ext.BLANK_IMAGE_URL,
                cls: "x-form-trigger x-form-clear-trigger"
            }, {
                tag: "img",
                src: Ext.BLANK_IMAGE_URL,
                cls: "x-form-trigger"
            }]
        };
        this.callParent()
    },
    onTrigger1Click: function () {
        this.collapse();
        this.setValue("");
        this.fireEvent("cleared")
    },
    setValue: function (a) {
        Ext.form.ClearableComboBox.superclass.setValue.call(this, a);
        if (this.rendered) {
            this.triggers[0][!Ext.isEmpty(a) ? "show" : "hide"]()
        }
    },
    onDestroy: function () {
        Ext.destroy(this.triggers);
        Ext.form.ClearableComboBox.superclass.onDestroy.apply(this, arguments)
    }
});

Ext.require(["Ext.panel.*"]);
Ext.define("Ext.ux.SimpleIFrame", {
    extend: "Ext.Panel",
    alias: "widget.simpleiframe",
    src: "about:blank",
    loadingText: "Loading ...",
    initComponent: function () {
        this.updateHTML();
        this.callParent(arguments)
    },
    updateHTML: function () {
        this.html = '<iframe id="iframe-' + this.id + '" style="overflow:auto;width:100%;height:100%;" frameborder="0"  src="' + this.src + '"></iframe>'
    },
    reload: function () {
        this.setSrc(this.src)
    },
    reset: function () {
        var b = this.getDOM();
        var a = b.parentNode;
        if (b && a) {
            b.src = "about:blank";
            b.parentNode.removeChild(b)
        }
        b = document.createElement("iframe");
        b.frameBorder = 0;
        b.src = this.src;
        b.id = "iframe-" + this.id;
        b.style.overflow = "auto";
        b.style.width = "100%";
        b.style.height = "100%";
        a.appendChild(b)
    },
    setSrc: function (c, a) {
        this.src = c;
        var b = this.getDOM();
        if (b) {
            b.src = c
        }
    },
    getSrc: function () {
        return this.src
    },
    getDOM: function () {
        return document.getElementById("iframe-" + this.id)
    },
    getDocument: function () {
        var a = this.getDOM();
        a = (a.contentWindow) ? a.contentWindow : (a.contentDocument.document) ? a.contentDocument.document : a.contentDocument;
        return a.document
    },
    destroy: function () {
        var a = this.getDOM();
        if (a && a.parentNode) {
            a.src = "about:blank";
            a.parentNode.removeChild(a)
        }
        this.callParent(arguments)
    },
    update: function (b) {
        var c;
        this.setSrc("about:blank");
        try {
            c = this.getDocument();
            c.open();
            c.write(b);
            c.close()
        } catch (a) {
            this.reset();
            c = this.getDocument();
            c.open();
            c.write(b);
            c.close()
        }
    }
});

Ext.define("PartKeepr.PartUnit", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "shortName",
        type: "string"
    }, {
        name: "default",
        type: "bool"
    }],
    proxy: PartKeepr.getRESTProxy("PartUnit"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.ManufacturerICLogo", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "string"
    }, {
        name: "originalFilename",
        type: "string"
    }, {
        name: "footprint_id",
        type: "int"
    }, {
        name: "mimetype",
        type: "string"
    }, {
        name: "extension",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "size",
        type: "string"
    }],
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Manufacturer",
        primaryKey: "id",
        foreignKey: "manufacturer_id"
    },
    proxy: PartKeepr.getRESTProxy("ManufacturerICLogo")
});

Ext.define("PartKeepr.PartParameter", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "part_id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "unit_id",
        type: "int"
    }, {
        name: "siprefix_id",
        type: "int"
    }, {
        name: "value",
        type: "float"
    }, {
        name: "prefixedValue"
    }],
    proxy: PartKeepr.getRESTProxy("PartParameter")
});

Ext.define("PartKeepr.FootprintAttachment", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "string"
    }, {
        name: "originalFilename",
        type: "string"
    }, {
        name: "footprint_id",
        type: "int"
    }, {
        name: "mimetype",
        type: "string"
    }, {
        name: "extension",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "size",
        type: "string"
    }],
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Footprint",
        primaryKey: "id",
        foreignKey: "footprint_id"
    },
    proxy: PartKeepr.getRESTProxy("FootprintAttachment")
});

Ext.define("PartKeepr.Footprint", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "image_id",
        type: "string"
    }, {
        name: "category",
        type: "int"
    }],
    hasMany: {
        model: "PartKeepr.FootprintAttachment",
        name: "attachments"
    },
    proxy: PartKeepr.getRESTProxy("Footprint"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.PartManufacturer", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "part_id",
        type: "int"
    }, {
        name: "part_name",
        type: "string"
    }, {
        name: "manufacturer_id",
        type: "int"
    }, {
        name: "manufacturer_name",
        type: "string"
    }, {
        name: "partNumber",
        type: "string"
    }],
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Part",
        primaryKey: "id",
        foreignKey: "part_id"
    },
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Manufacturer",
        primaryKey: "id",
        foreignKey: "manufacturer_id"
    },
    proxy: PartKeepr.getRESTProxy("PartManufacturer")
});

Ext.define("PartKeepr.UserPreference", {
    extend: "Ext.data.Model",
    fields: [{
        name: "key",
        type: "string"
    }, {
        name: "value"
    }, {
        name: "user_id",
        type: "int"
    }],
    proxy: PartKeepr.getRESTProxy("UserPreference")
});

Ext.define("PartKeepr.SiPrefix", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "prefix",
        type: "string"
    }, {
        name: "symbol",
        type: "string"
    }, {
        name: "power",
        type: "int"
    }],
    proxy: PartKeepr.getRESTProxy("SiPrefix")
});

Ext.define("PartKeepr.ProjectReportList", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "user_id",
        type: "int"
    }, {
        name: "amount",
        type: "int",
        defaultValue: 1
    }],
    hasMany: [{
        model: "PartKeepr.ProjectPart",
        name: "parts"
    }, {
        model: "PartKeepr.ProjectAttachment",
        name: "attachments"
    }],
    proxy: PartKeepr.getRESTProxy("Project"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.Unit", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "symbol",
        type: "string"
    }],
    hasMany: {
        model: "PartKeepr.SiPrefix",
        name: "prefixes"
    },
    proxy: PartKeepr.getRESTProxy("Unit"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.Part", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "category",
        type: "int"
    }, {
        name: "footprint",
        type: "int"
    }, {
        name: "storageLocation",
        type: "int"
    }, {
        name: "partUnit",
        type: "int"
    }, {
        name: "averagePrice",
        type: "float"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "comment",
        type: "string"
    }, {
        name: "status",
        type: "string"
    }, {
        name: "stockLevel",
        type: "int"
    }, {
        name: "minStockLevel",
        type: "int"
    }, {
        name: "createDate",
        type: "datetime"
    }, {
        name: "needsReview",
        type: "boolean"
    }, {
        name: "initialStockLevel",
        type: "int"
    }, {
        name: "initialStockLevelUser",
        type: "int"
    }, {
        name: "initialStockLevelPrice",
        type: "float"
    }, {
        name: "initialStockLevelPricePerItem",
        type: "boolean"
    }, {
        name: "partUnitName",
        type: "string"
    }, {
        name: "footprintName",
        type: "string"
    }, {
        name: "storageLocationName",
        type: "string"
    }, {
        name: "categoryName",
        type: "string"
    }, {
        name: "categoryPath",
        type: "string"
    }, {
        name: "attachmentCount",
        type: "int"
    }, {
        name: "partUnitDefault",
        type: "boolean",
        convert: function (a) {
            if (a === "true" || a === "1" || a === true) {
                return true
            } else {
                return false
            }
        }
    }],
    belongsTo: [{
        model: "PartKeepr.StorageLocation",
        primaryKey: "id",
        foreignKey: "storageLocation"
    }, {
        model: "PartKeepr.Footprint",
        primaryKey: "id",
        foreignKey: "footprint"
    }, {
        model: "PartKeepr.PartCategory",
        primaryKey: "id",
        foreignKey: "category"
    }],
    hasMany: [{
        model: "PartKeepr.PartDistributor",
        name: "distributors"
    }, {
        model: "PartKeepr.PartManufacturer",
        name: "manufacturers"
    }, {
        model: "PartKeepr.PartParameter",
        name: "parameters"
    }, {
        model: "PartKeepr.PartAttachment",
        name: "attachments"
    }],
    proxy: PartKeepr.getRESTProxy("Part"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.ProjectReport", {
    extend: "Ext.data.Model",
    fields: [{
        name: "quantity",
        type: "int"
    }, {
        name: "storageLocation_name",
        type: "string"
    }, {
        name: "available",
        type: "int"
    }, {
        name: "missing",
        type: "int"
    }, {
        name: "distributor_order_number",
        type: "string"
    }, {
        name: "sum_order",
        type: "float"
    }, {
        name: "sum",
        type: "float"
    }, {
        name: "projects",
        type: "string"
    }, {
        name: "remarks",
        type: "string"
    }],
    hasMany: [{
        model: "PartKeepr.Part",
        name: "part"
    }],
    proxy: PartKeepr.getRESTProxy("ProjectReport")
});

Ext.define("PartKeepr.SystemNotice", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "date",
        type: "date",
        dateFormat: "Y-m-d H:i:s"
    }, {
        name: "title",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }],
    proxy: PartKeepr.getRESTProxy("SystemNotice"),
    getRecordName: function () {
        return this.get("title")
    }
});

Ext.define("PartKeepr.SystemInformationRecord", {
    extend: "Ext.data.Model",
    fields: [{
        name: "name",
        type: "string"
    }, {
        name: "value",
        type: "string"
    }, {
        name: "category",
        type: "string"
    }]
});

Ext.define("PartKeepr.ProjectAttachment", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "string"
    }, {
        name: "originalFilename",
        type: "string"
    }, {
        name: "project_id",
        type: "int"
    }, {
        name: "mimetype",
        type: "string"
    }, {
        name: "extension",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "size",
        type: "string"
    }],
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Project",
        primaryKey: "id",
        foreignKey: "project_id"
    },
    proxy: PartKeepr.getRESTProxy("ProjectAttachment")
});

Ext.define("PartKeepr.Distributor", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "url",
        type: "string"
    }, {
        name: "comment",
        type: "string"
    }, {
        name: "address",
        type: "string"
    }, {
        name: "phone",
        type: "string"
    }, {
        name: "fax",
        type: "string"
    }, {
        name: "email",
        type: "string"
    }],
    proxy: PartKeepr.getRESTProxy("Distributor"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.Project", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "user_id",
        type: "int"
    }],
    hasMany: [{
        model: "PartKeepr.ProjectPart",
        name: "parts"
    }, {
        model: "PartKeepr.ProjectAttachment",
        name: "attachments"
    }],
    proxy: PartKeepr.getRESTProxy("Project"),
    getRecordName: function () {
        return this.get("name")
    }
});
Ext.define("PartKeepr.Message", {
    extend: "Ext.data.Model",
    fields: [{
        name: "message",
        type: "string"
    }, {
        name: "severity",
        type: "string"
    }, {
        name: "date",
        type: "date"
    }]
});

Ext.define("PartKeepr.TipOfTheDay", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "url",
        type: "string"
    }, {
        name: "read",
        type: "boolean"
    }],
    proxy: PartKeepr.getRESTProxy("TipOfTheDay")
});

Ext.define("PartKeepr.ProjectPart", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "project_id",
        type: "int"
    }, {
        name: "part_id",
        type: "int"
    }, {
        name: "part_name",
        type: "string"
    }, {
        name: "quantity",
        type: "int"
    }, {
        name: "remarks",
        type: "string"
    }],
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Project",
        primaryKey: "id",
        foreignKey: "project_id"
    },
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Part",
        primaryKey: "id",
        foreignKey: "part_id"
    },
    proxy: PartKeepr.getRESTProxy("ProjectPart")
});

Ext.define("PartKeepr.User", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "username",
        type: "string"
    }, {
        name: "password",
        type: "string"
    }],
    proxy: PartKeepr.getRESTProxy("User"),
    getRecordName: function () {
        return this.get("username")
    }
});

Ext.define("PartKeepr.StockEntry", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "username",
        type: "string"
    }, {
        name: "user_id",
        type: "int"
    }, {
        name: "dateTime",
        type: "datetime"
    }, {
        name: "stockLevel",
        type: "int"
    }, {
        name: "storageLocation_name",
        type: "string"
    }, {
        name: "direction",
        type: "string"
    }, {
        name: "part_name",
        type: "string"
    }, {
        name: "price",
        type: "float"
    }, {
        name: "comment",
        type: "string"
    }]
});

Ext.define("PartKeepr.AbstractCategory", {
    extend: "Ext.data.Model",
    isCategory: true
});

Ext.define("PartKeepr.FootprintCategory", {
    extend: "PartKeepr.AbstractCategory",
    fields: [{
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "parent",
        type: "int"
    }],
    proxy: PartKeepr.getRESTProxy("FootprintCategory"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.PartCategory", {
    extend: "PartKeepr.AbstractCategory",
    fields: [{
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "parent",
        type: "int"
    }],
    proxy: PartKeepr.getRESTProxy("PartCategory"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.StatisticSample", {
    extend: "Ext.data.Model",
    fields: [{
        name: "start",
        type: "date",
        dateFormat: "Y-m-d H:i:s"
    }, {
        name: "parts",
        type: "int",
        useNull: true
    }, {
        name: "categories",
        type: "int",
        useNull: true
    }]
});

Ext.define("PartKeepr.PartDistributor", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "part_id",
        type: "int"
    }, {
        name: "part_name",
        type: "string"
    }, {
        name: "distributor_id",
        type: "int"
    }, {
        name: "distributor_name",
        type: "string"
    }, {
        name: "price",
        type: "float"
    }, {
        name: "orderNumber",
        type: "string"
    }, {
        name: "packagingUnit",
        type: "int"
    }],
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Part",
        primaryKey: "id",
        foreignKey: "part_id"
    },
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Distributor",
        primaryKey: "id",
        foreignKey: "distributor_id"
    },
    proxy: PartKeepr.getRESTProxy("PartDistributor")
});

Ext.define("PartKeepr.Manufacturer", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "url",
        type: "string"
    }, {
        name: "comment",
        type: "string"
    }, {
        name: "address",
        type: "string"
    }, {
        name: "phone",
        type: "string"
    }, {
        name: "fax",
        type: "string"
    }, {
        name: "email",
        type: "string"
    }],
    hasMany: {
        model: "PartKeepr.ManufacturerICLogo",
        name: "iclogos"
    },
    proxy: PartKeepr.getRESTProxy("Manufacturer"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.StorageLocation", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "int"
    }, {
        name: "name",
        type: "string"
    }, {
        name: "image_id",
        type: "string"
    }],
    proxy: PartKeepr.getRESTProxy("StorageLocation"),
    getRecordName: function () {
        return this.get("name")
    }
});

Ext.define("PartKeepr.PartAttachment", {
    extend: "Ext.data.Model",
    fields: [{
        id: "id",
        name: "id",
        type: "string"
    }, {
        name: "originalFilename",
        type: "string"
    }, {
        name: "footprint_id",
        type: "int"
    }, {
        name: "mimetype",
        type: "string"
    }, {
        name: "extension",
        type: "string"
    }, {
        name: "description",
        type: "string"
    }, {
        name: "size",
        type: "string"
    }],
    belongsTo: {
        type: "belongsTo",
        model: "PartKeepr.Part",
        primaryKey: "id",
        foreignKey: "part_id"
    },
    proxy: PartKeepr.getRESTProxy("PartAttachment")
});

Ext.define("PartKeepr.ServiceCall", {
    extend: "Ext.util.Observable",
    service: null,
    call: null,
    sHandler: null,
    parameters: {},
    loadMessage: null,
    anonymous: false,
    constructor: function (a, b) {
        this.setService(a);
        this.setCall(b);
        this.parameters = {}
    },
    enableAnonymous: function () {
        this.anonymous = true
    },
    disableAnonymous: function () {
        this.anonymous = false
    },
    setService: function (a) {
        this.service = a
    },
    setCall: function (a) {
        this.call = a
    },
    setParameter: function (b, a) {
        this.parameters[b] = a
    },
    setParameters: function (a) {
        Ext.apply(this.parameters, a)
    },
    setLoadMessage: function (a) {
        this.loadMessage = a
    },
    setHandler: function (a) {
        this.sHandler = a
    },
    doCall: function () {
        PartKeepr.getApplication().getStatusbar().startLoad(this.loadMessage);
        var a = Ext.encode(this.parameters);
        var b = {
            call: this.call,
            lang: Ext.getLocale()
        };
        if (!this.anonymous) {
            b.session = PartKeepr.getApplication().getSessionManager().getSession()
        }
        Ext.Ajax.request({
            url: PartKeepr.getBasePath() + "/" + this.service + "/" + this.call,
            success: Ext.bind(this.onSuccess, this),
            failure: Ext.bind(this.onError, this),
            method: "POST",
            params: a,
            headers: b
        })
    },
    onSuccess: function (b, c) {
        PartKeepr.getApplication().getStatusbar().endLoad();
        try {
            var a = Ext.decode(b.responseText)
        } catch (e) {
            var d = {
                message: i18n("Critical Error"),
                detail: i18n("The server returned a response which we were not able to interpret.")
            };
            var f = {
                response: b.responseText,
                request: Ext.encode(c)
            };
            PartKeepr.ExceptionWindow.showException(d, f);
            return
        }
        if (a.status == "error") {
            this.displayError(a.exception);
            PartKeepr.getApplication().getStatusbar().setStatus({
                text: this.getErrorMessage(a.exception),
                iconCls: "x-status-error",
                clear: {
                    useDefaults: true,
                    anim: false
                }
            });
            return
        }
        if (a.status == "systemerror") {
            this.displaySystemError(a);
            PartKeepr.getApplication().getStatusbar().setStatus({
                text: this.getErrorMessage(a),
                iconCls: "x-status-error",
                clear: {
                    useDefaults: true,
                    anim: false
                }
            });
            return
        }
        if (this.sHandler) {
            this.sHandler(a.response)
        }
    },
    onError: function (a, b) {
        var e;
        try {
            var f = Ext.decode(a.responseText);
            e = {
                response: a.responseText,
                request: Ext.encode(b)
            };
            PartKeepr.ExceptionWindow.showException(f.exception, e)
        } catch (d) {
            var c = {
                message: i18n("Critical Error"),
                detail: i18n("The server returned a response which we were not able to interpret."),
                backtrace: a.responseText
            };
            e = {
                response: a.responseText,
                request: Ext.encode(b)
            };
            PartKeepr.ExceptionWindow.showException(c, e)
        }
        PartKeepr.getApplication().getStatusbar().endLoad()
    },
    displayError: function (a) {
        Ext.Msg.show({
            title: i18n("Error"),
            msg: this.getErrorMessage(a),
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.ERROR
        })
    },
    getErrorMessage: function (b) {
        var a;
        if (b.message === "") {
            a = b.exception
        } else {
            a = b.message
        }
        return a
    },
    displaySystemError: function (b) {
        var a;
        a = "Error Message: " + b.message + "<br>";
        a += "Exception:" + b.exception + "<br>";
        a += "Backtrace:<br>" + str_replace("\n", "<br>", b.backtrace);
        Ext.Msg.maxWidth = 800;
        Ext.Msg.show({
            title: i18n("System Error"),
            msg: a,
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.ERROR
        })
    }
});

Ext.define("PartKeepr.Menu", {
    extend: "Ext.toolbar.Toolbar",
    items: [{}]
});

Ext.define("PartKeepr.TipOfTheDayWindow", {
    extend: "Ext.window.Window",
    titleTemplate: i18n("Tip of the Day"),
    width: 600,
    height: 300,
    minWidth: 600,
    minHeight: 300,
    layout: "fit",
    currentTip: null,
    tipStore: null,
    initComponent: function () {
        this.title = this.titleTemplate;
        this.tipStore = PartKeepr.getApplication().getTipOfTheDayStore();
        this.tipDisplay = Ext.create("Ext.ux.SimpleIFrame", {
            border: false
        });
        this.items = this.tipDisplay;
        this.previousButton = Ext.create("Ext.button.Button", {
            text: i18n("Previous Tip"),
            handler: Ext.bind(this.displayPreviousTip, this),
            icon: "resources/icons/tip_previous.png",
            disabled: true
        });
        this.nextButton = Ext.create("Ext.button.Button", {
            text: i18n("Next Tip"),
            icon: "resources/icons/tip_next.png",
            handler: Ext.bind(this.displayNextTip, this)
        });
        this.showTipsCheckbox = Ext.create("Ext.form.field.Checkbox", {
            boxLabel: i18n("Show Tips on login"),
            handler: Ext.bind(this.showTipsHandler, this)
        });
        this.displayReadTipsCheckbox = Ext.create("Ext.form.field.Checkbox", {
            boxLabel: i18n("Show read tips"),
            handler: Ext.bind(this.showReadTipsHandler, this)
        });
        if (PartKeepr.getApplication().getUserPreference("partkeepr.tipoftheday.showtips") === false) {
            this.showTipsCheckbox.setValue(false)
        } else {
            this.showTipsCheckbox.setValue(true)
        }
        this.dockedItems = [{
            xtype: "toolbar",
            dock: "bottom",
            ui: "footer",
            defaults: {
                minWidth: 100
            },
            pack: "start",
            items: [this.previousButton, this.nextButton, "->", this.showTipsCheckbox, this.displayReadTipsCheckbox]
        }];
        this.on("show", this.displayNextTip, this);
        this.on("destroy", this.onDestroy, this);
        this.callParent()
    },
    showReadTipsHandler: function () {
        this.updateButtons(this.currentTip)
    },
    onDestroy: function () {
        this.cancelReadTimer()
    },
    cancelReadTimer: function () {
        if (this.markAsReadTask) {
            this.markAsReadTask.cancel()
        }
    },
    showTipsHandler: function (b, a) {
        PartKeepr.getApplication().setUserPreference("partkeepr.tipoftheday.showtips", a)
    },
    displayTip: function (a) {
        this.cancelReadTimer();
        this.updateButtons(a);
        this.setTitle(this.titleTemplate + ": " + a.get("name"));
        this.tipDisplay.setSrc(a.get("url"));
        this.markAsReadTask = new Ext.util.DelayedTask(this.markTipRead, this);
        this.markAsReadTask.delay(5000)
    },
    updateButtons: function (a) {
        if (this.displayReadTipsCheckbox.getValue() === true) {
            if (this.tipStore.indexOf(a) > 0) {
                this.previousButton.enable()
            } else {
                this.previousButton.disable()
            }
            if (this.tipStore.indexOf(a) === this.tipStore.getTotalCount() - 1) {
                this.nextButton.disable()
            } else {
                this.nextButton.enable()
            }
        } else {
            if (this.tipStore.indexOf(a) > this.getFirstUnreadTip()) {
                this.previousButton.enable()
            } else {
                this.previousButton.disable()
            }
            if (this.tipStore.indexOf(a) >= this.getLastUnreadTip()) {
                this.nextButton.disable()
            } else {
                this.nextButton.enable()
            }
        }
    },
    getFirstUnreadTip: function () {
        for (var a = 0; a < this.tipStore.getTotalCount(); a++) {
            if (this.tipStore.getAt(a).get("read") === false) {
                return a
            }
        }
        return null
    },
    getLastUnreadTip: function () {
        for (var a = this.tipStore.getTotalCount() - 1; a > -1; a--) {
            if (this.tipStore.getAt(a).get("read") === false) {
                return a
            }
        }
        return null
    },
    markTipRead: function () {
        this.currentTip.set("read", true);
        this.currentTip.commit();
        var a = new PartKeepr.ServiceCall("TipOfTheDay", "markTipAsRead");
        a.setLoadMessage(sprintf(i18n("Marking tip %s as read..."), this.currentTip.get("name")));
        a.setParameter("name", this.currentTip.get("name"));
        a.doCall()
    },
    displayNextTip: function () {
        this.retrieveTip("ASC")
    },
    displayPreviousTip: function () {
        this.retrieveTip("DESC")
    },
    retrieveTip: function (b) {
        var c = -1,
            a = null;
        if (this.currentTip) {
            c = this.tipStore.indexOf(this.currentTip)
        }
        if (b === "ASC") {
            a = this.extractNextTip(c)
        } else {
            a = this.extractPreviousTip(c)
        }
        if (a) {
            this.currentTip = a;
            this.displayTip(a)
        }
    },
    extractNextTip: function (d) {
        var a = null,
            e = null;
        if (this.displayReadTipsCheckbox.getValue() === true) {
            var b = d + 1;
            if (b > this.tipStore.getTotalCount() - 1) {
                b = this.tipStore.getTotalCount() - 1
            }
            e = this.tipStore.getAt(b)
        } else {
            for (var c = d + 1; c < this.tipStore.getTotalCount(); c++) {
                a = this.tipStore.getAt(c);
                if (a.get("read") === false) {
                    e = a;
                    break
                }
            }
        }
        return e
    },
    extractPreviousTip: function (d) {
        var a = null,
            e = null;
        if (this.displayReadTipsCheckbox.getValue() === true) {
            var b = d - 1;
            if (b < 0) {
                b = 0
            }
            e = this.tipStore.getAt(b)
        } else {
            for (var c = d - 1; c > -1; c--) {
                a = this.tipStore.getAt(c);
                if (a.get("read") === false) {
                    e = a;
                    break
                }
            }
        }
        return e
    }
});

Ext.define("PartKeepr.ProjectReportView", {
    extend: "Ext.panel.Panel",
    alias: "widget.ProjectReportView",
    bodyStyle: "background:#DBDBDB;padding: 5px",
    border: false,
    defaults: {
        bodyStyle: "padding:10px"
    },
    layout: "border",
    initComponent: function () {
        this.createStores();
        this.upperGridEditing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit: 1
        });
        this.reportList = Ext.create("PartKeepr.BaseGrid", {
            selModel: {
                mode: "MULTI"
            },
            selType: "checkboxmodel",
            flex: 1,
            columns: [{
                header: i18n("Amount"),
                dataIndex: "amount",
                width: 50,
                editor: {
                    xtype: "numberfield"
                }
            }, {
                header: i18n("Project Name"),
                dataIndex: "name",
                flex: 1
            }, {
                header: i18n("Description"),
                dataIndex: "description",
                flex: 1
            }],
            store: this.store,
            plugins: [this.upperGridEditing]
        });
        this.editing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit: 1
        });
        this.reportResult = Ext.create("PartKeepr.BaseGrid", {
            flex: 1,
            features: [{
                ftype: "summary"
            }],
            columns: [{
                header: i18n("Quantity"),
                dataIndex: "quantity",
                width: 50
            }, {
                header: i18n("Part"),
                renderer: function (c, a, b) {
                    return b.part().getAt(0).get("name")
                },
                flex: 1
            }, {
                header: i18n("Remarks"),
                dataIndex: "remarks",
                flex: 1
            }, {
                header: i18n("Projects"),
                dataIndex: "projects",
                flex: 1
            }, {
                header: i18n("Storage Location"),
                dataIndex: "storageLocation_name",
                width: 100
            }, {
                header: i18n("Available"),
                dataIndex: "available",
                width: 75
            }, {
                header: i18n("Distributor"),
                dataIndex: "distributor_id",
                renderer: function (c, a, b) {
                    return b.get("distributor_name")
                },
                flex: 1,
                editor: {
                    xtype: "DistributorComboBox",
                    triggerAction: "query",
                    ignoreQuery: true,
                    forceSelection: true,
                    editable: false
                }
            }, {
                header: i18n("Distributor Order Number"),
                dataIndex: "distributor_order_number",
                flex: 1,
                editor: {
                    xtype: "textfield"
                }
            }, {
                header: i18n("Price per Item"),
                dataIndex: "price",
                width: 100
            }, {
                header: i18n("Sum"),
                dataIndex: "sum",
                summaryType: "sum",
                width: 100
            }, {
                header: i18n("Amount to Order"),
                dataIndex: "missing",
                width: 100
            }, {
                header: i18n("Sum (Order)"),
                dataIndex: "sum_order",
                summaryType: "sum",
                width: 100
            }],
            store: this.projectReportStore,
            plugins: [this.editing]
        });
        this.reportResult.on("beforeedit", this.onBeforeEdit, this);
        this.reportResult.on("edit", this.onEdit, this);
        this.createReportButton = Ext.create("Ext.button.Button", {
            xtype: "button",
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
        this.autoFillButton = Ext.create("Ext.button.Button", {
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
        this.removeStockButton = Ext.create("Ext.button.Button", {
            text: i18n("Remove parts from stock"),
            width: 160,
            listeners: {
                click: this.onStockRemovalClick,
                scope: this
            }
        });
        this.items = [{
            title: i18n("Choose Projects to create a report for"),
            split: true,
            minHeight: 300,
            height: 300,
            bodyStyle: "background:#DBDBDB;padding: 10px;",
            layout: {
                type: "vbox",
                align: "stretch",
                pack: "start"
            },
            region: "north",
            items: [this.reportList,
            {
                layout: {
                    type: "hbox",
                    pack: "start"
                },
                margins: {
                    top: 10
                },
                border: false,
                bodyStyle: "background:#DBDBDB",
                items: [this.createReportButton, this.autoFillButton,
                {
                    xtype: "tbspacer"
                },
                this.removeStockButton]
            }]
        }, {
            region: "center",
            layout: "fit",
            bodyStyle: "background:#DBDBDB;padding: 10px;",
            title: i18n("Project Report"),
            items: this.reportResult
        }];
        this.callParent()
    },
    onBeforeEdit: function (c) {
        if (c.field !== "distributor_id") {
            return
        }
        var d = c.record.part().getAt(0).distributors();
        var b = new Array();
        for (var a = 0; a < d.count(); a++) {
            b.push(d.getAt(a).get("distributor_id"))
        }
        c.column.getEditor().store.clearFilter();
        c.column.getEditor().store.filter({
            filterFn: function (f) {
                for (var e = 0; e < b.length; e++) {
                    if (f.get("id") == b[e]) {
                        return true
                    }
                }
                return false
            }
        })
    },
    onStockRemovalClick: function () {
        Ext.Msg.confirm(i18n("Remove parts from stock"), i18n("Do you really want to remove the parts in the project report from the stock?"), this.removeStocks, this)
    },
    removeStocks: function (c) {
        if (c == "yes") {
            var a = this.reportResult.getStore();
            var e = [];
            for (var b = 0; b < a.count(); b++) {
                var f = a.getAt(b);
                e.push({
                    part: f.part().getAt(0).get("id"),
                    amount: f.get("quantity"),
                    comment: f.get("projects")
                })
            }
            var d = new PartKeepr.ServiceCall("Part", "massDeleteStock");
            d.setParameter("removals", e);
            d.doCall()
        }
    },
    onEdit: function (b, c) {
        if (c.field == "distributor_id") {
            var d = c.record.part().getAt(0).distributors();
            for (var a = 0; a < d.count(); a++) {
                if (d.getAt(a).get("distributor_id") == c.value) {
                    c.record.set("distributor_name", d.getAt(a).get("distributor_name"));
                    c.record.set("price", d.getAt(a).get("price"));
                    c.record.set("distributor_order_number", d.getAt(a).get("orderNumber"));
                    c.record.set("sum_order", c.record.get("missing") * c.record.get("price"));
                    c.record.set("sum", c.record.get("quantity") * c.record.get("price"))
                }
            }
        }
        this.reportResult.getView().refresh(true)
    },
    onAutoFillClick: function () {
        for (var f = 0; f < this.reportResult.store.count(); f++) {
            var d = this.reportResult.store.getAt(f);
            var c = null;
            var b = null;
            for (var e = 0; e < d.part().getAt(0).distributors().count(); e++) {
                var a = d.part().getAt(0).distributors().getAt(e);
                if (b === null && parseFloat(a.get("price")) !== 0) {
                    b = a.get("price");
                    c = a
                } else {
                    if (parseFloat(a.get("price")) !== 0 && parseFloat(a.get("price")) < b) {
                        b = a.get("price");
                        c = a
                    }
                }
            }
            if (c !== null) {
                d.set("distributor_name", c.get("distributor_name"));
                d.set("distributor_order_number", c.get("orderNumber"));
                d.set("price", c.get("price"));
                d.set("sum_order", d.get("missing") * d.get("price"));
                d.set("sum", d.get("quantity") * d.get("price"))
            }
        }
        this.reportResult.getView().refresh(true)
    },
    onCreateReportClick: function () {
        selection = this.reportList.getSelectionModel().getSelection();
        var b = new Array();
        for (var a = 0; a < selection.length; a++) {
            b.push({
                project: selection[a].get("id"),
                amount: selection[a].get("amount")
            })
        }
        this.projectReportStore.getProxy().extraParams.reports = Ext.encode(b);
        this.projectReportStore.load()
    },
    createStores: function () {
        var a = {
            autoLoad: true,
            model: "PartKeepr.ProjectReportList",
            pageSize: -1
        };
        this.store = Ext.create("Ext.data.Store", a);
        this.projectReportStore = Ext.create("Ext.data.Store", {
            model: "PartKeepr.ProjectReport",
            pageSize: -1
        })
    }
});

Ext.define("PartKeepr.BaseGrid", {
    extend: "Ext.grid.Panel",
    alias: "widget.BaseGrid",
    initComponent: function () {
        if (this.plugins) {
            this.plugins.push("gridmenu")
        } else {
            this.plugins = ["gridmenu"]
        }
        this.callParent()
    }
});

Ext.define("PartKeepr.ProjectPartGrid", {
    extend: "PartKeepr.BaseGrid",
    columns: [{
        header: i18n("Quantity"),
        dataIndex: "quantity",
        wdith: 50,
        editor: {
            xtype: "numberfield",
            allowBlank: false,
            minValue: 1
        }
    }, {
        header: i18n("Part"),
        dataIndex: "part_id",
        flex: 1,
        editor: {
            xtype: "RemotePartComboBox"
        },
        renderer: function (c, a, b) {
            return b.get("part_name")
        }
    }, {
        header: i18n("Remarks"),
        dataIndex: "remarks",
        flex: 1,
        editor: {
            xtype: "textfield"
        }
    }],
    initComponent: function () {
        this.editing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit: 1
        });
        this.plugins = [this.editing];
        this.deleteButton = Ext.create("Ext.button.Button", {
            text: i18n("Delete"),
            disabled: true,
            itemId: "delete",
            scope: this,
            icon: "resources/silkicons/brick_delete.png",
            handler: this.onDeleteClick
        });
        this.viewButton = Ext.create("Ext.button.Button", {
            text: i18n("View Part"),
            disabled: true,
            itemId: "view",
            scope: this,
            icon: "resources/silkicons/brick_go.png",
            handler: this.onViewClick
        });
        this.dockedItems = [{
            xtype: "toolbar",
            items: [{
                text: i18n("Add"),
                scope: this,
                icon: "resources/silkicons/brick_add.png",
                handler: this.onAddClick
            }, {
                text: i18n("Create new Part"),
                scope: this,
                icon: "resources/silkicons/brick_add.png",
                handler: this.onAddPartClick
            },
            this.deleteButton, this.viewButton]
        }];
        this.callParent();
        this.getSelectionModel().on("selectionchange", this.onSelectChange, this)
    },
    onAddClick: function () {
        this.editing.cancelEdit();
        var a = new PartKeepr.ProjectPart({
            quantity: 1
        });
        this.store.insert(this.store.count(), a);
        this.editing.startEdit(a, this.columns[0])
    },
    onAddPartClick: function () {
        var a = Ext.getCmp("partkeepr-partmanager").onItemAdd();
        a.editor.on("editorClose", function (b) {
            if (b.record.phantom) {
                return
            }
            this.editing.cancelEdit();
            var c = new PartKeepr.ProjectPart({
                quantity: 1,
                part_id: b.record.get("id"),
                part_name: b.record.get("name")
            });
            this.store.insert(this.store.count(), c);
            this.editing.startEdit(c, this.columns[0])
        }, this)
    },
    onDeleteClick: function () {
        var a = this.getView().getSelectionModel().getSelection()[0];
        if (a) {
            this.store.remove(a)
        }
    },
    onViewClick: function () {
        var a = this.getView().getSelectionModel().getSelection()[0];
        if (a) {
            Ext.getCmp("partkeepr-partmanager").onEditPart(a.get("part_id"))
        }
    },
    onSelectChange: function (a, b) {
        this.deleteButton.setDisabled(b.length === 0);
        this.viewButton.setDisabled(b.length === 0)
    }
});

Ext.define("PartKeepr.AbstractStockHistoryGrid", {
    extend: "PartKeepr.BaseGrid",
    pageSize: 25,
    defineColumns: function () {
        this.columns = [{
            header: "",
            xtype: "actioncolumn",
            dataIndex: "direction",
            renderer: function (a) {
                if (a == "out") {
                    return '<img title="' + i18n("Parts removed") + '" src="resources/silkicons/brick_delete.png"/>'
                } else {
                    return '<img title="' + i18n("Parts added") + '" src="resources/silkicons/brick_add.png"/>'
                }
            },
            width: 20
        }, {
            header: i18n("Date"),
            dataIndex: "dateTime",
            width: 120
        }, {
            header: i18n("User"),
            dataIndex: "user_id",
            flex: 1,
            minWidth: 80,
            renderer: function (c, a, b) {
                return b.get("username")
            },
            editor: {
                xtype: "UserComboBox"
            }
        }, {
            header: i18n("Amount"),
            dataIndex: "stockLevel",
            width: 50,
            editor: {
                xtype: "numberfield",
                allowBlank: false
            }
        }, {
            header: i18n("Price"),
            editor: {
                xtype: "numberfield",
                allowBlank: false
            },
            dataIndex: "price",
            width: 60,
            renderer: function (c, a, b) {
                if (b.get("dir") == "out") {
                    return "-"
                } else {
                    return c
                }
            }
        }, {
            header: i18n("Comment"),
            dataIndex: "comment",
            width: 60,
            editor: {
                xtype: "textfield",
                allowBlank: true
            }
        }]
    },
    model: "PartKeepr.StockEntry",
    initComponent: function () {
        this.defineColumns();
        var a = {
            autoLoad: false,
            autoSync: true,
            remoteFilter: true,
            remoteSort: true,
            proxy: PartKeepr.getRESTProxy("Stock"),
            model: "PartKeepr.StockEntry",
            sorters: [{
                property: "dateTime",
                direction: "DESC"
            }],
            pageSize: this.pageSize
        };
        this.store = Ext.create("Ext.data.Store", a);
        this.editing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit: 1
        });
        this.plugins = [this.editing];
        this.bottomToolbar = Ext.create("Ext.toolbar.Paging", {
            store: this.store,
            enableOverflow: true,
            dock: "bottom",
            displayInfo: false
        });
        this.dockedItems = new Array();
        this.dockedItems.push(this.bottomToolbar);
        this.editing.on("beforeedit", this.onBeforeEdit, this);
        this.callParent()
    },
    onBeforeEdit: function (b) {
        var a = b.record.get("username") == PartKeepr.getApplication().getUsername();
        switch (b.field) {
        case "price":
            if (b.record.get("direction") == "out") {
                return false
            }
            if (!a && !PartKeepr.getApplication().isAdmin()) {
                return false
            }
            break;
        case "stockLevel":
            if (!PartKeepr.getApplication().isAdmin()) {
                return false
            }
            break;
        case "user":
            if (!PartKeepr.getApplication().isAdmin()) {
                return false
            }
            break;
        case "comment":
            if (!a && !PartKeepr.getApplication().isAdmin()) {
                return false
            }
            break;
        default:
            return true
        }
        return true
    }
});

Ext.define("PartKeepr.StockHistoryGrid", {
    extend: "PartKeepr.AbstractStockHistoryGrid",
    alias: "widget.PartStockHistory",
    pageSize: 25,
    defineColumns: function () {
        this.callParent();
        this.columns.splice(2, 0, {
            header: i18n("Part"),
            dataIndex: "part_name",
            flex: 1,
            minWidth: 200
        });
        this.columns.splice(3, 0, {
            header: i18n("Storage Location"),
            dataIndex: "storageLocation_name",
            flex: 1,
            minWidth: 200
        })
    },
    initComponent: function () {
        this.callParent();
        this.on("activate", this.onActivate, this)
    },
    onActivate: function () {
        this.store.load()
    }
});

Ext.define("PartKeepr.PartStockHistory", {
    extend: "PartKeepr.AbstractStockHistoryGrid",
    alias: "widget.PartStockHistory",
    initComponent: function () {
        this.callParent();
        this.on("activate", this.onActivate, this)
    },
    onActivate: function () {
        var a = this.store.getProxy();
        a.extraParams.part = this.part;
        this.store.load()
    }
});

Ext.define("PartKeepr.MessageLog", {
    extend: "PartKeepr.BaseGrid",
    store: {
        model: "PartKeepr.Message"
    },
    columns: [{
        header: i18n("Message"),
        dataIndex: "message",
        flex: 1
    }, {
        header: i18n("Date"),
        dataIndex: "date",
        width: 300
    }, {
        header: i18n("Severity"),
        dataIndex: "severity"
    }],
    proxy: {
        type: "memory",
        reader: {
            type: "json",
            root: "items"
        }
    },
    sorters: [{
        property: "date",
        direction: "DESC"
    }]
});

Ext.define("PartKeepr.AttachmentGrid", {
    extend: "PartKeepr.BaseGrid",
    alias: "widget.AttachmentGrid",
    border: false,
    model: null,
    initComponent: function () {
        if (this.model === null) {
            alert("Error: Model can't be null!")
        }
        this.store = Ext.create("Ext.data.Store", {
            model: this.model,
            proxy: {
                type: "memory",
                reader: {
                    type: "json"
                }
            }
        });
        this.editing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit: 1
        });
        this.plugins = [this.editing];
        this.deleteButton = Ext.create("Ext.button.Button", {
            text: i18n("Delete"),
            disabled: true,
            itemId: "delete",
            scope: this,
            icon: "resources/silkicons/delete.png",
            handler: this.onDeleteClick
        });
        this.viewButton = Ext.create("Ext.button.Button", {
            text: i18n("View"),
            handler: this.onViewClick,
            scope: this,
            icon: "resources/silkicons/zoom.png",
            disabled: true
        });
        this.webcamButton = Ext.create("Ext.button.Button", {
            text: i18n("Take image"),
            handler: this.onWebcamClick,
            scope: this,
            icon: "resources/fugue-icons/icons/webcam.png"
        });
        this.dockedItems = [{
            xtype: "toolbar",
            items: [{
                text: i18n("Add"),
                scope: this,
                icon: "resources/silkicons/attach.png",
                handler: this.onAddClick
            },
            this.webcamButton, this.viewButton, this.deleteButton]
        }];
        this.columns = [{
            dataIndex: "extension",
            width: 30,
            renderer: function (a) {
                return '<img src="resources/mimetypes/' + a + '.png"/>'
            }
        }, {
            header: i18n("Filename"),
            dataIndex: "originalFilename",
            width: 200
        }, {
            header: i18n("Size"),
            dataIndex: "size",
            width: 80,
            renderer: PartKeepr.bytesToSize
        }, {
            header: i18n("Description"),
            dataIndex: "description",
            flex: 0.4,
            editor: {
                xtype: "textfield",
                allowBlank: true
            }
        }];
        this.callParent();
        this.getSelectionModel().on("selectionchange", this.onSelectChange, this);
        this.on("itemdblclick", this.onDoubleClick, this)
    },
    onWebcamClick: function () {
        var b = Ext.create("PartKeepr.WebcamPanel");
        b.on("uploadComplete", this.onFileUploaded, this);
        var a = Ext.create("Ext.window.Window", {
            title: i18n("Take Webcam Photo"),
            items: [b]
        });
        b.on("uploadComplete", function () {
            a.close()
        });
        a.show()
    },
    onDoubleClick: function (b, a) {
        if (a) {
            this.viewAttachment(a)
        }
    },
    onAddClick: function () {
        var a = Ext.create("PartKeepr.FileUploadDialog");
        a.on("fileUploaded", this.onFileUploaded, this);
        a.show()
    },
    onFileUploaded: function (a) {
        this.editing.cancelEdit();
        this.store.insert(this.store.getCount(), Ext.create(this.model, {
            id: "TMP:" + a.id,
            extension: a.extension,
            size: a.size,
            originalFilename: a.originalFilename
        }))
    },
    onDeleteClick: function () {
        var a = this.getView().getSelectionModel().getSelection()[0];
        if (a) {
            this.store.remove(a)
        }
    },
    onSelectChange: function (a, b) {
        this.deleteButton.setDisabled(b.length === 0);
        this.viewButton.setDisabled(b.length === 0)
    },
    onViewClick: function () {
        var a = this.getView().getSelectionModel().getSelection()[0];
        if (a) {
            this.viewAttachment(a)
        }
    },
    viewAttachment: function (a) {
        var b = "file.php?type=" + this.model + "&";
        if (a.get("id") === 0) {
            b += "id=0&tmpId=" + a.get("tmp_id")
        } else {
            b += "id=" + a.get("id")
        }
        new Ext.Window({
            title: i18n("Display File"),
            width: 640,
            height: 600,
            maximizable: true,
            constrain: true,
            layout: "fit",
            items: [{
                xtype: "component",
                autoEl: {
                    tag: "iframe",
                    src: b
                }
            }]
        }).show()
    }
});

Ext.define("PartKeepr.ProjectAttachmentGrid", {
    extend: "PartKeepr.AttachmentGrid",
    alias: "widget.ProjectAttachmentGrid",
    model: "PartKeepr.ProjectAttachment"
});

Ext.define("PartKeepr.FootprintAttachmentGrid", {
    extend: "PartKeepr.AttachmentGrid",
    alias: "widget.FootprintAttachmentGrid",
    model: "PartKeepr.FootprintAttachment"
});

Ext.define("PartKeepr.PartAttachmentGrid", {
    extend: "PartKeepr.AttachmentGrid",
    alias: "widget.PartAttachmentGrid",
    model: "PartKeepr.PartAttachment"
});

Ext.define("PartKeepr.UserPreferenceGrid", {
    extend: "PartKeepr.BaseGrid",
    columnLines: true,
    columns: [{
        header: i18n("Key"),
        dataIndex: "key",
        flex: 0.3,
        minWidth: 200,
        renderer: Ext.util.Format.htmlEncode
    }, {
        header: i18n("Value"),
        dataIndex: "value",
        flex: 0.7,
        minWidth: 200,
        renderer: Ext.util.Format.htmlEncode
    }],
    userId: null,
    initComponent: function () {
        this.deleteButton = Ext.create("Ext.button.Button", {
            text: i18n("Delete"),
            disabled: true,
            itemId: "delete",
            scope: this,
            icon: "resources/silkicons/delete.png",
            handler: this.onDeleteClick
        });
        this.dockedItems = [{
            xtype: "toolbar",
            items: [this.deleteButton]
        }];
        this.store = Ext.create("Ext.data.Store", {
            model: "PartKeepr.UserPreference",
            pageSize: -1
        });
        this.callParent();
        this.getSelectionModel().on("selectionchange", this.onSelectChange, this)
    },
    onDeleteClick: function () {
        var a = this.getView().getSelectionModel().getSelection()[0];
        if (a) {
            a.phantom = false;
            this.store.remove(a)
        }
    },
    onSelectChange: function (a, b) {
        this.deleteButton.setDisabled(b.length === 0)
    },
    syncPreferences: function () {
        for (var a = 0; a < this.store.removed.length; a++) {
            var b = new PartKeepr.ServiceCall("UserPreference", "destroy");
            b.setParameter("key", this.store.removed[a].get("key"));
            b.setParameter("user_id", this.store.removed[a].get("user_id"));
            b.doCall()
        }
        this.store.removed = []
    }
});

Ext.define("PartKeepr.SystemInformationGrid", {
    extend: "PartKeepr.BaseGrid",
    columns: [{
        header: "Name",
        dataIndex: "name",
        width: 200
    }, {
        header: "Value",
        dataIndex: "value",
        renderer: "htmlEncode",
        flex: 1
    }, {
        header: "Category",
        dataIndex: "category",
        hidden: true
    }],
    initComponent: function () {
        var a = Ext.create("Ext.grid.feature.Grouping", {
            groupHeaderTpl: "{name}"
        });
        this.features = [a];
        this.store = Ext.create("Ext.data.Store", {
            model: "PartKeepr.SystemInformationRecord",
            sorters: ["category", "name"],
            groupField: "category",
            proxy: {
                type: "memory"
            }
        });
        this.refreshButton = Ext.create("Ext.button.Button", {
            handler: this.requestSystemInformation,
            scope: this,
            text: i18n("Refresh")
        });
        this.bottomToolbar = Ext.create("Ext.toolbar.Toolbar", {
            dock: "bottom",
            ui: "footer",
            items: [this.refreshButton]
        });
        this.dockedItems = [this.bottomToolbar];
        this.callParent();
        this.requestSystemInformation()
    },
    requestSystemInformation: function () {
        var a = new PartKeepr.ServiceCall("System", "getSystemInformation");
        a.setHandler(Ext.bind(this.processSystemInformationRecords, this));
        a.doCall()
    },
    processSystemInformationRecords: function (a) {
        this.store.removeAll();
        this.view.all.clear();
        for (var b = 0; b < a.data.length; b++) {
            var c = new PartKeepr.SystemInformationRecord({
                category: a.data[b].category,
                name: a.data[b].name,
                value: a.data[b].value
            });
            this.store.insert(0, c)
        }
    }
});

Ext.define("PartKeepr.EditorGrid", {
    extend: "PartKeepr.BaseGrid",
    alias: "widget.EditorGrid",
    deleteButtonText: i18n("Delete Item"),
    deleteButtonIcon: "resources/silkicons/delete.png",
    addButtonText: i18n("Add Item"),
    addButtonIcon: "resources/silkicons/add.png",
    enableTopToolbar: true,
    buttonTextMode: "hide",
    initComponent: function () {
        this.addEvents("itemSelect", "itemDeselect", "itemEdit", "itemDelete", "itemAdd");
        this.getSelectionModel().on("select", this._onItemSelect, this);
        this.getSelectionModel().on("deselect", this._onItemDeselect, this);
        this.on("itemclick", this._onItemEdit, this);
        this.deleteButton = Ext.create("Ext.button.Button", {
            text: (this.buttonTextMode !== "hide") ? this.deleteButtonText : "",
            tooltip: this.deleteButtonText,
            icon: this.deleteButtonIcon,
            handler: Ext.bind(function () {
                this.fireEvent("itemDelete")
            }, this),
            disabled: true
        });
        this.addButton = Ext.create("Ext.button.Button", {
            text: (this.buttonTextMode !== "hide") ? this.addButtonText : "",
            tooltip: this.addButtonText,
            icon: this.addButtonIcon,
            handler: Ext.bind(function () {
                this.fireEvent("itemAdd")
            }, this)
        });
        this.searchField = Ext.create("Ext.ux.form.SearchField", {
            store: this.store
        });
        this.topToolbar = Ext.create("Ext.toolbar.Toolbar", {
            dock: "top",
            enableOverflow: true,
            items: [this.addButton, this.deleteButton,
            {
                xtype: "tbfill"
            },
            this.searchField]
        });
        this.bottomToolbar = Ext.create("Ext.toolbar.Paging", {
            store: this.store,
            enableOverflow: true,
            dock: "bottom",
            displayInfo: false
        });
        this.dockedItems = new Array();
        this.dockedItems.push(this.bottomToolbar);
        if (this.enableTopToolbar) {
            this.dockedItems.push(this.topToolbar)
        }
        this.plugins = ["gridmenu"];
        this.callParent()
    },
    syncChanges: function (a) {
        this.store.load()
    },
    _updateDeleteButton: function (a, b) {
        if (this.getSelectionModel().getCount() == 1) {
            this.deleteButton.enable()
        } else {
            this.deleteButton.disable()
        }
    },
    _onItemEdit: function (b, a) {
        this.fireEvent("itemEdit", a.get("id"))
    },
    _onItemSelect: function (a, b) {
        this._updateDeleteButton(a, b);
        this.fireEvent("itemSelect", b)
    },
    _onItemDeselect: function (a, b) {
        this._updateDeleteButton(a, b);
        this.fireEvent("itemDeselect", b)
    }
});

Ext.define("PartKeepr.SystemNoticeGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.SystemNoticeGrid",
    columns: [{
        header: i18n("Name"),
        dataIndex: "title",
        flex: 1
    }],
    enableTopToolbar: false
});

Ext.define("PartKeepr.ProjectGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.ProjectGrid",
    columns: [{
        header: i18n("Project"),
        dataIndex: "name",
        flex: 1
    }],
    addButtonText: i18n("Add Project"),
    addButtonIcon: "resources/fugue-icons/icons/drill--plus.png",
    deleteButtonText: i18n("Delete Project"),
    deleteButtonIcon: "resources/fugue-icons/icons/drill--minus.png"
});

Ext.define("PartKeepr.ManufacturerGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.ManufacturerGrid",
    columns: [{
        header: i18n("Manufacturer"),
        dataIndex: "name",
        flex: 1
    }],
    addButtonText: i18n("Add Manufacturer"),
    addButtonIcon: "resources/silkicons/building_add.png",
    deleteButtonText: i18n("Delete Manufacturer"),
    deleteButtonIcon: "resources/silkicons/building_delete.png"
});

Ext.define("PartKeepr.UserGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.UserGrid",
    columns: [{
        header: i18n("User"),
        dataIndex: "username",
        flex: 1
    }],
    addButtonText: i18n("Add User"),
    addButtonIcon: "resources/silkicons/user_add.png",
    deleteButtonText: i18n("Delete User"),
    deleteButtonIcon: "resources/silkicons/user_delete.png"
});

Ext.define("PartKeepr.PartUnitGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.PartUnitGrid",
    columns: [{
        header: i18n("Part Measurement Unit"),
        dataIndex: "name",
        flex: 1
    }, {
        header: i18n("Default"),
        dataIndex: "default",
        width: 60,
        renderer: function (a) {
            if (a === true) {
                return "?"
            } else {
                return ""
            }
        }
    }],
    addButtonText: i18n("Add Part Measurement Unit"),
    addButtonIcon: "resources/fugue-icons/icons/ruler--plus.png",
    deleteButtonText: i18n("Delete Part Measurement Unit"),
    deleteButtonIcon: "resources/fugue-icons/icons/ruler--minus.png",
    defaultButtonIcon: "resources/fugue-icons/icons/ruler--pencil.png",
    initComponent: function () {
        this.callParent();
        this.defaultButton = Ext.create("Ext.button.Button", {
            icon: this.defaultButtonIcon,
            tooltip: i18n("Mark Part Measurement Unit as Default"),
            disabled: true,
            handler: this.onDefaultClick,
            scope: this
        });
        this.getSelectionModel().on("deselect", Ext.bind(function (b, c, a) {
            this.defaultButton.disable()
        }, this));
        this.getSelectionModel().on("select", Ext.bind(function (b, c, a) {
            this.defaultButton.enable()
        }, this));
        this.topToolbar.insert(2, {
            xtype: "tbseparator"
        });
        this.topToolbar.insert(3, this.defaultButton)
    },
    onDefaultClick: function () {
        var b = this.getSelectionModel().getLastSelected();
        var a = new PartKeepr.ServiceCall("PartUnit", "setDefault");
        a.setParameter("id", b.get("id"));
        a.setHandler(Ext.bind(this.onDefaultHandler, this));
        a.doCall()
    },
    onDefaultHandler: function () {
        this.store.load()
    }
});

Ext.define("PartKeepr.UnitGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.UnitGrid",
    columns: [{
        header: i18n("Unit"),
        dataIndex: "name",
        flex: 1
    }, {
        header: i18n("Symbol"),
        dataIndex: "symbol",
        width: 60
    }],
    addButtonText: i18n("Add Unit"),
    addButtonIcon: "resources/icons/unit_add.png",
    deleteButtonText: i18n("Delete Unit"),
    deleteButtonIcon: "resources/icons/unit_delete.png",
    initComponent: function () {
        this.callParent()
    }
});

Ext.define("PartKeepr.DistributorGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.DistributorGrid",
    columns: [{
        header: i18n("Distributor"),
        dataIndex: "name",
        flex: 1
    }],
    addButtonText: i18n("Add Distributor"),
    addButtonIcon: "resources/silkicons/lorry_add.png",
    deleteButtonText: i18n("Delete Distributor"),
    deleteButtonIcon: "resources/silkicons/lorry_delete.png"
});

Ext.define("PartKeepr.StorageLocationGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.StorageLocationGrid",
    columns: [{
        header: i18n("Storage Location"),
        dataIndex: "name",
        flex: 1
    }],
    addButtonText: i18n("Add Storage Location"),
    addButtonIcon: "resources/fugue-icons/icons/wooden-box--plus.png",
    deleteButtonText: i18n("Delete Storage Location"),
    deleteButtonIcon: "resources/fugue-icons/icons/wooden-box--minus.png",
    initComponent: function () {
        this.callParent();
        this.multiCreateButton = Ext.create("Ext.button.Button", {
            icon: "resources/icons/storagelocation_multiadd.png",
            tooltip: i18n("Multi-create storage locations"),
            handler: this.onMultiCreateClick,
            scope: this
        });
        this.topToolbar.insert(2, {
            xtype: "tbseparator"
        });
        this.topToolbar.insert(3, this.multiCreateButton)
    },
    onMultiCreateClick: function () {
        var a = Ext.create("PartKeepr.StorageLocationMultiCreateWindow", {
            listeners: {
                destroy: {
                    fn: this.onMultiCreateWindowDestroy,
                    scope: this
                }
            }
        });
        a.show()
    },
    onMultiCreateWindowDestroy: function () {
        this.store.load()
    }
});

Ext.define("PartKeepr.PartsGrid", {
    extend: "PartKeepr.EditorGrid",
    alias: "widget.PartsGrid",
    buttonTextMode: "show",
    addButtonText: i18n("Add Part"),
    addButtonIcon: "resources/silkicons/brick_add.png",
    deleteButtonText: i18n("Delete Part"),
    deleteButtonIcon: "resources/silkicons/brick_delete.png",
    expandRowButtonIcon: "resources/icons/group-expand.png",
    collapseRowButtonIcon: "resources/icons/group-collapse.png",
    viewConfig: {
        plugins: {
            ddGroup: "CategoryTree",
            ptype: "gridviewdragdrop",
            enableDrop: false
        }
    },
    enableDragDrop: true,
    stripeRows: true,
    multiSelect: true,
    autoScroll: false,
    invalidateScrollerOnRefresh: true,
    initComponent: function () {
        this.groupingFeature = Ext.create("Ext.grid.feature.Grouping", {
            groupHeaderTpl: "{name} ({rows.length} " + i18n("Part(s)") + ")"
        });
        this.defineColumns();
        this.features = [this.groupingFeature];
        this.on("itemdblclick", this.onDoubleClick, this);
        this.addEvents("editPart");
        this.on("scrollershow", function (a) {
            if (a && a.scrollEl) {
                a.clearManagedListeners();
                a.mon(a.scrollEl, "scroll", a.onElScroll, a)
            }
        });
        this.editing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit: 1
        });
        this.editing.on("edit", this.onEdit, this);
        this.callParent();
        this.bottomToolbar.add({
            xtype: "button",
            tooltip: i18n("Expand all Groups"),
            icon: this.expandRowButtonIcon,
            listeners: {
                scope: this.groupingFeature,
                click: this.groupingFeature.expandAll
            }
        });
        this.bottomToolbar.add({
            xtype: "button",
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
                this.fireEvent("itemCreateFromTemplate")
            }, this),
            tooltip: i18n("Add a new part, using the selected part as template"),
            text: i18n("Create from Template"),
            icon: "resources/silkicons/brick_link.png"
        });
        this.topToolbar.insert(2, this.addFromTemplateButton)
    },
    _updateAddTemplateButton: function (a, b) {
        if (this.getSelectionModel().getCount() == 1) {
            this.addFromTemplateButton.enable()
        } else {
            this.addFromTemplateButton.disable()
        }
    },
    _onItemSelect: function (a, b) {
        this._updateAddTemplateButton(a, b);
        this.callParent(arguments)
    },
    _onItemDeselect: function (a, b) {
        this._updateAddTemplateButton(a, b);
        this.callParent(arguments)
    },
    onDoubleClick: function (b, a) {
        if (a) {
            this.fireEvent("editPart", a.get("id"))
        }
    },
    defineColumns: function () {
        this.columns = [{
            header: "",
            dataIndex: "",
            width: 30,
            renderer: this.iconRenderer
        }, {
            header: i18n("Name"),
            dataIndex: "name",
            flex: 1,
            minWidth: 200,
            renderer: Ext.util.Format.htmlEncode
        }, {
            header: i18n("Storage Location"),
            dataIndex: "storageLocationName"
        }, {
            header: i18n("Status"),
            dataIndex: "status"
        }, {
            header: i18n("Stock"),
            dataIndex: "stockLevel",
            editor: {
                xtype: "numberfield",
                allowBlank: false
            },
            renderer: this.stockLevelRenderer
        }, {
            header: i18n("Min. Stock"),
            dataIndex: "minStockLevel",
            renderer: this.stockLevelRenderer
        }, {
            header: i18n("Avg. Price"),
            dataIndex: "averagePrice"
        }, {
            header: i18n("Footprint"),
            dataIndex: "footprintName"
        }, {
            header: i18n("Category"),
            dataIndex: "categoryPath",
            hidden: true
        }, {
            header: i18n("Create Date"),
            dataIndex: "createDate",
            hidden: true
        }]
    },
    stockLevelRenderer: function (c, a, b) {
        if (b.get("partUnitDefault") !== true) {
            return c + " " + b.get("partUnitName")
        } else {
            return c
        }
    },
    iconRenderer: function (d, b, c) {
        var a = "";
        if (c.get("attachmentCount") > 0) {
            a += '<img src="resources/diagona-icons/icons/10/190.png" style="margin-top: 2px;" alt="' + i18n("Has attachments") + '" title="' + i18n("Has attachments") + '"/>'
        }
        return a
    },
    setCategory: function (b) {
        this.currentCategory = b;
        var a = this.store.getProxy();
        a.extraParams.category = b;
        this.searchField.onTrigger1Click();
        this.store.currentPage = 1;
        this.store.load({
            start: 0
        })
    },
    onEdit: function (a, b) {
        switch (b.field) {
        case "stockLevel":
            this.handleStockFieldEdit(b);
            break;
        default:
            break
        }
    },
    handleStockFieldEdit: function (a) {
        if (PartKeepr.getApplication().getUserPreference("partkeepr.inline-stock-change.confirm") === false) {
            this.handleStockChange(a)
        } else {
            this.confirmStockChange(a)
        }
    },
    confirmStockChange: function (d) {
        var c = "";
        var b = "";
        if (d.value < 0) {
            c = sprintf(i18n("You wish to remove <b>%s %s</b> of the part <b>%s</b>. Is this correct?"), abs(d.value), d.record.get("partUnitName"), d.record.get("name"));
            d.record.set("stockLevel", (d.originalValue - abs(d.value)));
            b = i18n("Remove Part(s)")
        } else {
            c = sprintf(i18n("You wish to set the stock level to <b>%s %s</b> of part <b>%s</b>. Is this correct?"), abs(d.value), d.record.get("partUnitName"), d.record.get("name"));
            b = i18n("Set Stock Level for Part(s)")
        }
        var a = new PartKeepr.RememberChoiceMessageBox({
            escButtonAction: "cancel",
            dontAskAgainProperty: "partkeepr.inlinestockremoval.ask",
            dontAskAgainValue: false
        });
        a.show({
            title: b,
            msg: c,
            buttons: Ext.Msg.OKCANCEL,
            fn: this.afterConfirmStockChange,
            scope: this,
            originalOnEdit: d,
            dialog: a
        })
    },
    afterConfirmStockChange: function (a, c, b) {
        if (a == "cancel") {
            b.originalOnEdit.record.set("stockLevel", b.originalOnEdit.originalValue)
        }
        if (a == "ok") {
            if (b.dialog.rememberChoiceCheckbox.getValue() === true) {
                PartKeepr.getApplication().setUserPreference("partkeepr.inline-stock-change.confirm", false)
            }
            this.handleStockChange(b.originalOnEdit)
        }
    },
    handleStockChange: function (c) {
        var d, b = 0;
        if (c.value < 0) {
            d = "deleteStock";
            b = abs(c.value)
        } else {
            if (c.originalValue <= c.value) {
                d = "deleteStock";
                b = c.originalValue - c.value
            } else {
                d = "addStock";
                b = c.value - c.originalValue
            }
        }
        var a = new PartKeepr.ServiceCall("Part", d);
        a.setParameter("stock", b);
        a.setParameter("part", c.record.get("id"));
        a.setHandler(Ext.bind(this.reloadPart, this, [c]));
        a.doCall()
    },
    reloadPart: function (a) {
        this.loadPart(a.record.get("id"), a)
    },
    loadPart: function (b, a) {
        PartKeepr.Part.load(b, {
            scope: this,
            success: this.onPartLoaded
        })
    },
    onPartLoaded: function (a, b) {
        var c = this.store.findRecord("id", a.get("id"));
        if (c) {
            c.set("stockLevel", a.get("stockLevel"))
        }
    }
});

Ext.define("PartKeepr.PartParameterGrid", {
    extend: "PartKeepr.BaseGrid",
    alias: "widget.PartParameterGrid",
    border: false,
    initComponent: function () {
        this.store = Ext.create("Ext.data.Store", {
            model: "PartKeepr.PartParameter",
            proxy: {
                type: "memory",
                reader: {
                    type: "json"
                }
            }
        });
        this.editing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit: 1,
            listeners: {
                scope: this,
                beforeedit: this.onBeforeEdit,
                edit: this.onAfterEdit
            }
        });
        this.plugins = [this.editing];
        this.deleteButton = Ext.create("Ext.button.Button", {
            text: i18n("Delete"),
            disabled: true,
            itemId: "delete",
            scope: this,
            icon: "resources/fugue-icons/icons/table--minus.png",
            handler: this.onDeleteClick
        });
        this.dockedItems = [{
            xtype: "toolbar",
            items: [{
                text: i18n("Add"),
                scope: this,
                icon: "resources/fugue-icons/icons/table--plus.png",
                handler: this.onAddClick
            },
            this.deleteButton]
        }];
        this.columns = [{
            header: i18n("Parameter"),
            dataIndex: "name",
            flex: 0.2,
            editor: {
                xtype: "PartParameterComboBox",
                allowBlank: false,
                lazyRender: true,
                listClass: "x-combo-list-small",
                selectOnTab: true
            }
        }, {
            header: i18n("Value"),
            flex: 0.2,
            dataIndex: "prefixedValue",
            renderer: function (d, a, c) {
                if (!Ext.isObject(d)) {
                    return ""
                }
                var b = PartKeepr.getApplication().getUnitStore().findRecord("id", c.get("unit_id"));
                if (b) {
                    return d.value + " " + d.symbol + b.get("symbol")
                } else {
                    return d.value + " " + d.symbol
                }
            },
            editor: {
                xtype: "SiUnitField",
                decimalPrecision: 20
            }
        }, {
            header: i18n("Unit"),
            flex: 0.2,
            dataIndex: "unit_id",
            renderer: function (d, a, c) {
                var b = PartKeepr.getApplication().getUnitStore().findRecord("id", d);
                if (b) {
                    return b.get("name")
                } else {
                    return ""
                }
            },
            editor: {
                xtype: "UnitComboBox",
                allowBlank: true
            }
        }, {
            header: i18n("Description"),
            dataIndex: "description",
            flex: 0.3,
            editor: {
                xtype: "textfield",
                allowBlank: true
            }
        }];
        this.callParent();
        this.getSelectionModel().on("selectionchange", this.onSelectChange, this)
    },
    onAddClick: function () {
        this.editing.cancelEdit();
        var a = new PartKeepr.PartParameter({});
        this.store.insert(0, a);
        this.editing.startEditByPosition({
            row: 0,
            column: 0
        })
    },
    onDeleteClick: function () {
        var a = this.getView().getSelectionModel().getSelection()[0];
        if (a) {
            this.store.remove(a)
        }
    },
    onSelectChange: function (a, b) {
        this.deleteButton.setDisabled(b.length === 0)
    },
    onBeforeEdit: function (a, d, f) {
        var g = this.headerCt.getHeaderAtIndex(a.colIdx);
        var c = this.editing.getEditor(a.record, g);
        if (a.field == "prefixedValue") {
            var b = PartKeepr.getApplication().getUnitStore().getById(a.record.get("unit_id"));
            if (b) {
                c.field.setStore(b.prefixes())
            }
        }
    },
    onAfterEdit: function (a, c) {
        var b = c.record.get("prefixedValue");
        c.record.set("siprefix_id", b.siprefix_id);
        c.record.set("value", b.value)
    }
});

Ext.define("PartKeepr.PartManufacturerGrid", {
    extend: "PartKeepr.BaseGrid",
    alias: "widget.PartManufacturerGrid",
    border: false,
    initComponent: function () {
        this.store = Ext.create("Ext.data.Store", {
            model: "PartKeepr.PartManufacturer",
            proxy: {
                type: "memory",
                reader: {
                    type: "json"
                }
            }
        });
        this.editing = Ext.create("Ext.grid.plugin.RowEditing", {
            clicksToEdit: 1
        });
        this.plugins = [this.editing];
        this.deleteButton = Ext.create("Ext.button.Button", {
            text: "Delete",
            disabled: true,
            itemId: "delete",
            scope: this,
            icon: "resources/silkicons/building_delete.png",
            handler: this.onDeleteClick
        });
        this.dockedItems = [{
            xtype: "toolbar",
            items: [{
                text: "Add",
                scope: this,
                icon: "resources/silkicons/building_add.png",
                handler: this.onAddClick
            },
            this.deleteButton]
        }];
        this.columns = [{
            header: i18n("Manufacturer"),
            dataIndex: "manufacturer_id",
            xtype: "templatecolumn",
            tpl: "{manufacturer_name}",
            flex: 0.4,
            editor: {
                xtype: "ManufacturerComboBox",
                allowBlank: true
            }
        }, {
            header: i18n("Part Number"),
            dataIndex: "partNumber",
            flex: 0.4,
            editor: {
                xtype: "textfield",
                allowBlank: true
            }
        }];
        this.callParent();
        this.getSelectionModel().on("selectionchange", this.onSelectChange, this);
        this.on("edit", this.onEdit, this)
    },
    onEdit: function (a) {
        var c = a.record.get("manufacturer_id");
        var b = PartKeepr.getApplication().getManufacturerStore().findRecord("id", c);
        if (b) {
            a.record.set("manufacturer_name", b.get("name"))
        }
    },
    onAddClick: function () {
        this.editing.cancelEdit();
        var a = new PartKeepr.PartManufacturer({
            packagingUnit: 1
        });
        this.store.insert(0, a);
        this.editing.startEdit(0, 0)
    },
    onDeleteClick: function () {
        var a = this.getView().getSelectionModel().getSelection()[0];
        if (a) {
            this.store.remove(a)
        }
    },
    onSelectChange: function (a, b) {
        this.deleteButton.setDisabled(b.length === 0)
    }
});

Ext.define("PartKeepr.PartDistributorGrid", {
    extend: "PartKeepr.BaseGrid",
    alias: "widget.PartDistributorGrid",
    border: false,
    initComponent: function () {
        this.store = Ext.create("Ext.data.Store", {
            model: "PartKeepr.PartDistributor",
            proxy: {
                type: "memory",
                reader: {
                    type: "json"
                }
            }
        });
        this.editing = Ext.create("Ext.grid.plugin.RowEditing", {
            clicksToEdit: 1
        });
        this.plugins = [this.editing];
        this.deleteButton = Ext.create("Ext.button.Button", {
            text: "Delete",
            disabled: true,
            itemId: "delete",
            scope: this,
            icon: "resources/silkicons/lorry_delete.png",
            handler: this.onDeleteClick
        });
        this.dockedItems = [{
            xtype: "toolbar",
            items: [{
                text: "Add",
                scope: this,
                icon: "resources/silkicons/lorry_add.png",
                handler: this.onAddClick
            },
            this.deleteButton]
        }];
        this.columns = [{
            header: i18n("Distributor"),
            dataIndex: "distributor_id",
            xtype: "templatecolumn",
            tpl: "{distributor_name}",
            flex: 0.3,
            editor: {
                xtype: "DistributorComboBox",
                allowBlank: true
            }
        }, {
            header: i18n("Order Number"),
            dataIndex: "orderNumber",
            flex: 0.3,
            editor: {
                xtype: "textfield",
                allowBlank: true
            }
        }, {
            header: i18n("Packaging Unit"),
            dataIndex: "packagingUnit",
            flex: 0.2,
            editor: {
                xtype: "numberfield",
                allowDecimals: false,
                allowBlank: false,
                minValue: 1
            }
        }, {
            header: i18n("Price per Item"),
            dataIndex: "price",
            flex: 0.2,
            editor: {
                xtype: "numberfield",
                allowDecimals: true,
                allowBlank: true
            }
        }];
        this.callParent();
        this.getSelectionModel().on("selectionchange", this.onSelectChange, this);
        this.on("edit", this.onEdit, this)
    },
    onEdit: function (a) {
        var c = a.record.get("distributor_id");
        var b = PartKeepr.getApplication().getDistributorStore().findRecord("id", c);
        if (b) {
            a.record.set("distributor_name", b.get("name"))
        }
    },
    onAddClick: function () {
        this.editing.cancelEdit();
        var a = new PartKeepr.PartDistributor({
            packagingUnit: 1
        });
        this.store.insert(0, a);
        this.editing.startEdit(0, 0)
    },
    onDeleteClick: function () {
        var a = this.getView().getSelectionModel().getSelection()[0];
        if (a) {
            this.store.remove(a)
        }
    },
    onSelectChange: function (a, b) {
        this.deleteButton.setDisabled(b.length === 0)
    }
});

Ext.define("PartKeepr.GridMenuPlugin", {
    alias: "plugin.gridmenu",
    grid: null,
    init: function (a) {
        this.grid = a;
        this.menu = new Ext.menu.Menu({
            floating: true,
            renderTo: Ext.getBody(),
            items: [{
                text: i18n("Export"),
                icon: "resources/fugue-icons/icons/application-export.png",
                menu: [{
                    icon: "resources/mimetypes/csv.png",
                    text: "Export as CSV (.csv)",
                    handler: this.exportCSV,
                    scope: this
                }, {
                    icon: "resources/fugue-icons/icons/blue-document-excel.png",
                    text: "Export as Excel XML (.xlsx)",
                    handler: this.exportXLSX,
                    scope: this
                }, {
                    icon: "resources/icons/mediawiki_icon.png",
                    text: "Export as MediaWiki table (.txt)",
                    handler: this.exportWiki,
                    scope: this
                }]
            }]
        });
        a.on("itemcontextmenu", function (c, b, g, d, h, f) {
            this.menu.showAt(h.xy[0], h.xy[1])
        }, this);
        a.on("containercontextmenu", function (b, d, c) {
            this.menu.showAt(d.xy[0], d.xy[1])
        }, this)
    },
    exportCSV: function () {
        this.doExport(Ext.ux.exporter.Exporter.exportAny(this.grid, "csv", {}), this.getExportFilename() + ".csv")
    },
    exportWiki: function () {
        this.doExport(Ext.ux.exporter.Exporter.exportAny(this.grid, "wiki", {}), this.getExportFilename() + ".txt")
    },
    exportXLSX: function () {
        this.doExport(Ext.ux.exporter.Exporter.exportAny(this.grid, "excel", {}), this.getExportFilename() + ".xlsx")
    },
    getExportFilename: function () {
        return this.grid.title
    },
    doExport: function (c, a) {
        var b = new PartKeepr.ServiceCall("TempFile", "jsonUpload");
        b.setParameter("filedata", Ext.ux.exporter.Base64.encode(c));
        b.setParameter("filename", a);
        b.setHandler(function (d) {
            var e = "file.php?type=temp&download=true&id=TMP:" + d.id;
            window.location.href = e
        });
        b.doCall()
    }
});

Ext.define("PartKeepr.CategoryEditorWindow", {
    extend: "Ext.window.Window",
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
        }, {
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
            this.setTitle(i18n("Edit Category"))
        } else {
            this.proxyRecord.set("parent", this.parent);
            this.setTitle(i18n("Add Category"))
        }
        this.form.getForm().loadRecord(this.proxyRecord);
        this.on("show", Ext.bind(this.onShow, this))
    },
    onEnter: function () {
        this.onSave()
    },
    onShow: function () {
        this.form.items.first().focus()
    },
    onSave: function () {
        this.form.getForm().updateRecord(this.proxyRecord);
        this.proxyRecord.save({
            success: Ext.bind(function (a) {
                this.fireEvent("save", a);
                this.destroy()
            }, this)
        })
    },
    onCancel: function () {
        this.destroy()
    }
});

Ext.define("PartKeepr.CategoryEditorForm", {
    extend: "Ext.form.Panel",
    layout: "anchor",
    border: false,
    frame: false,
    bodyStyle: "background:#DBDBDB;padding: 10px;",
    items: [{
        xtype: "textfield",
        name: "name",
        anchor: "100%",
        fieldLabel: i18n("Name")
    }, {
        xtype: "textarea",
        name: "description",
        anchor: "100%",
        fieldLabel: i18n("Description")
    }]
});

Ext.define("PartKeepr.UserPasswordChangePanel", {
    extend: "Ext.form.FormPanel",
    title: i18n("Change Password"),
    bodyStyle: "background:#DBDBDB;padding: 10px;",
    initComponent: function () {
        this.oldPassword = Ext.create("Ext.form.field.Text", {
            inputType: "password",
            name: "password",
            labelWidth: 150,
            style: "border-bottom: 1px solid grey; padding-bottom: 10px;",
            width: 300,
            fieldLabel: i18n("Current Password")
        });
        this.newPassword = Ext.create("Ext.form.field.Text", {
            style: "margin-top: 10px",
            inputType: "password",
            name: "password",
            labelWidth: 150,
            width: 300,
            fieldLabel: i18n("New Password")
        });
        this.newPasswordConfirm = Ext.create("Ext.form.field.Text", {
            inputType: "password",
            name: "password",
            labelWidth: 150,
            width: 300,
            validator: Ext.bind(this.validatePassword, this),
            fieldLabel: i18n("New Password (Confirm)")
        });
        this.items = [this.oldPassword, this.newPassword, this.newPasswordConfirm,
        {
            xtype: "fieldcontainer",
            hideEmptyLabel: false,
            width: 300,
            labelWidth: 150,
            items: {
                xtype: "button",
                handler: this.onChangePassword,
                scope: this,
                width: 145,
                icon: "resources/silkicons/accept.png",
                text: i18n("Change Password")
            }
        }];
        this.callParent()
    },
    onChangePassword: function () {
        if (this.getForm().isValid()) {
            var a = new PartKeepr.ServiceCall("UserPreference", "changePassword");
            a.setParameter("oldpassword", md5(this.oldPassword.getValue()));
            a.setParameter("newpassword", md5(this.newPassword.getValue()));
            a.setHandler(Ext.bind(this.onAfterPasswordChange, this));
            a.doCall()
        }
    },
    onAfterPasswordChange: function (a) {
        Ext.Msg.alert(a.data, a.data)
    },
    validatePassword: function () {
        if (this.newPassword.getValue() != this.newPasswordConfirm.getValue()) {
            return i18n("Passwords don't match")
        }
        return true
    }
});
Ext.define("PartKeepr.StockPreferencesPanel", {
    extend: "Ext.form.FormPanel",
    title: i18n("Stock Preferences"),
    bodyStyle: "background:#DBDBDB;padding: 10px;",
    initComponent: function () {
        this.confirmInlineStockLevelChangesCheckbox = Ext.create("Ext.form.field.Checkbox", {
            boxLabel: i18n("Confirm in-line stock level changes from the parts grid"),
            handler: Ext.bind(this.confirmInlineStockLevelChangesHandler, this)
        });
        if (PartKeepr.getApplication().getUserPreference("partkeepr.inline-stock-change.confirm") === false) {
            this.confirmInlineStockLevelChangesCheckbox.setValue(false)
        } else {
            this.confirmInlineStockLevelChangesCheckbox.setValue(true)
        }
        this.items = [this.confirmInlineStockLevelChangesCheckbox];
        this.callParent()
    },
    confirmInlineStockLevelChangesHandler: function (b, a) {
        PartKeepr.getApplication().setUserPreference("partkeepr.inline-stock-change.confirm", a)
    }
});
Ext.define("PartKeepr.TipOfTheDayPreferencesPanel", {
    extend: "Ext.form.FormPanel",
    title: i18n("Tip of the Day"),
    bodyStyle: "background:#DBDBDB;padding: 10px;",
    initComponent: function () {
        this.displayTipsOnLoginCheckbox = Ext.create("Ext.form.field.Checkbox", {
            boxLabel: i18n("Display tips on login"),
            handler: Ext.bind(this.showTipsHandler, this)
        });
        if (PartKeepr.getApplication().getUserPreference("partkeepr.tipoftheday.showtips") === false) {
            this.displayTipsOnLoginCheckbox.setValue(false)
        } else {
            this.displayTipsOnLoginCheckbox.setValue(true)
        }
        this.resetTipsButton = Ext.create("Ext.button.Button", {
            text: i18n("Mark all tips unread"),
            handler: this.onMarkAllTipsUnreadClick,
            scope: this
        });
        this.items = [this.displayTipsOnLoginCheckbox, this.resetTipsButton];
        this.callParent()
    },
    showTipsHandler: function (b, a) {
        PartKeepr.getApplication().setUserPreference("partkeepr.tipoftheday.showtips", a)
    },
    onMarkAllTipsUnreadClick: function () {
        var a = new PartKeepr.ServiceCall("TipOfTheDay", "markAllTipsAsUnread");
        a.setLoadMessage(i18n("Marking all tips as unerad..."));
        a.setHandler(function () {
            var b = i18n("All tips have been marked as unread");
            Ext.Msg.alert(b, b)
        });
        a.doCall()
    }
});
Ext.define("PartKeepr.UserPreferencePanel", {
    extend: "Ext.tab.Panel",
    title: i18n("User Preferences"),
    tabPosition: "bottom",
    initComponent: function () {
        this.passwordChangePanel = Ext.create("PartKeepr.UserPasswordChangePanel");
        this.tipsPanel = Ext.create("PartKeepr.TipOfTheDayPreferencesPanel");
        this.stockPanel = Ext.create("PartKeepr.StockPreferencesPanel");
        this.items = [this.tipsPanel, this.passwordChangePanel, this.stockPanel];
        this.callParent()
    }
});
Ext.define("PartKeepr.UserComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.UserComboBox",
    displayField: "username",
    valueField: "id",
    autoSelect: true,
    queryMode: "local",
    triggerAction: "all",
    forceSelection: true,
    editable: true,
    initComponent: function () {
        this.store = PartKeepr.getApplication().getUserStore();
        this.store.on("beforeload", function () {
            this._oldValue = this.getValue()
        }, this);
        this.store.on("load", function () {
            this.setValue(this._oldValue)
        }, this);
        this.callParent()
    }
});
Ext.define("PartKeepr.ManufacturerComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.ManufacturerComboBox",
    displayField: "name",
    valueField: "id",
    autoSelect: true,
    queryMode: "local",
    triggerAction: "all",
    forceSelection: true,
    editable: true,
    initComponent: function () {
        this.store = PartKeepr.getApplication().getManufacturerStore();
        this.store.on("beforeload", function () {
            this._oldValue = this.getValue()
        }, this);
        this.store.on("load", function () {
            this.setValue(this._oldValue)
        }, this);
        this.callParent()
    }
});
Ext.define("PartKeepr.CategoryComboBox", {
    extend: "Ext.form.field.Picker",
    alias: "widget.CategoryComboBox",
    requires: ["Ext.tree.Panel"],
    selectedValue: null,
    initComponent: function () {
        var a = this;
        Ext.apply(a, {
            pickerAlign: "tl-bl?",
            editable: false
        });
        a.callParent();
        this.createPicker()
    },
    createPicker: function () {
        var a = this;
        a.picker = new PartKeepr.CategoryTree({
            height: 290,
            categoryService: "PartCategory",
            categoryModel: "PartKeepr.PartCategory",
            floating: true,
            focusOnToFront: false,
            shadow: false,
            ownerCt: this.ownerCt
        });
        a.picker.on({
            itemclick: Ext.bind(function (c, b) {
                this.setValue(b.get("name"), true);
                this.setSelectedValue(b.get("id"));
                this.collapse()
            }, this),
            show: {
                fn: Ext.bind(function (c) {
                    var b = this.picker.getSelectionModel().getLastSelected();
                    this.picker.getView().focusRow(b)
                }, this),
                delay: 50
            }
        });
        a.picker.getView().on("render", Ext.bind(function () {
            var b = this.picker.getSelectionModel().getLastSelected();
            this.picker.getView().ensureVisible(b);
            this.picker.getView().focusRow(b)
        }, this));
        return a.picker
    },
    setSelectedValue: function (a) {
        this.selectedValue = a
    },
    getValue: function () {
        return this.selectedValue
    },
    setValue: function (b, a) {
        if (a) {
            this.callParent([b])
        }
        if (!this.picker) {
            return
        }
        if (!this.picker.loaded) {
            this.picker.on("categoriesLoaded", function () {
                this._setValue(b)
            }, this)
        } else {
            this._setValue(b)
        }
    },
    _setValue: function (b) {
        var a = this.findById(b);
        if (a !== null) {
            this.setSelectedValue(a.get("id"));
            this.setValue(a.get("name"), true);
            if (this.picker.getView().rendered) {
                this._selectRecords(a)
            } else {
                this.picker.getView().on("render", function () {
                    this._selectRecords(a)
                }, this)
            }
        }
    },
    _selectRecords: function (a) {
        this.picker.getView().select(a);
        this.picker.getView().ensureVisible(a);
        this.picker.getView().scrollIntoView(a)
    },
    findById: function (a) {
        return this.picker.getRootNode().findChild("id", a, true)
    },
    alignPicker: function () {
        var d = this,
            c, b, a = "-above";
        if (this.isExpanded) {
            c = d.getPicker();
            if (d.matchFieldWidth) {
                c.setWidth(d.bodyEl.getWidth())
            }
            if (c.isFloating()) {
                c.alignTo(d.inputEl, d.pickerAlign, d.pickerOffset);
                b = c.el.getY() < d.inputEl.getY();
                d.bodyEl[b ? "addCls" : "removeCls"](d.openCls + a);
                c.el[b ? "addCls" : "removeCls"](c.baseCls + a)
            }
        }
    },
    getErrors: function (a) {
        if (this.getValue() === null) {
            return [i18n("You need to select a category")]
        }
        return []
    }
});
Ext.define("PartKeepr.StorageLocationComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.StorageLocationComboBox",
    displayField: "name",
    valueField: "id",
    queryMode: "local",
    triggerAction: "all",
    trigger2Cls: Ext.baseCSSPrefix + "form-reload-trigger",
    onTrigger1Click: function () {
        this.onTriggerClick()
    },
    onTrigger2Click: function () {
        this.expand();
        this.store.load()
    },
    initComponent: function () {
        this.store = Ext.create("Ext.data.Store", {
            model: "PartKeepr.StorageLocation",
            proxy: PartKeepr.getRESTProxy("StorageLocation"),
            pageSize: -1,
            autoLoad: true
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.UnitComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.UnitComboBox",
    displayField: "name",
    valueField: "id",
    autoSelect: true,
    queryMode: "local",
    triggerAction: "all",
    forceSelection: true,
    editable: true,
    initComponent: function () {
        this.store = PartKeepr.getApplication().getUnitStore();
        this.store.on("beforeload", function () {
            this._oldValue = this.getValue()
        }, this);
        this.store.on("load", function () {
            this.setValue(this._oldValue)
        }, this);
        this.callParent()
    }
});
Ext.define("PartKeepr.SiUnitField", {
    extend: "Ext.form.field.Picker",
    alias: "widget.SiUnitField",
    siPrefix: null,
    allowDecimals: true,
    decimalSeparator: ".",
    decimalPrecision: 2,
    minValue: Number.NEGATIVE_INFINITY,
    maxValue: Number.MAX_VALUE,
    minText: "The minimum value for this field is {0}",
    maxText: "The maximum value for this field is {0}",
    nanText: "{0} is not a valid number",
    negativeText: "The value cannot be negative",
    baseChars: "0123456789",
    autoStripChars: false,
    initComponent: function () {
        var c = this,
            d;
        c.callParent();
        c.setMinValue(c.minValue);
        c.setMaxValue(c.maxValue);
        if (c.disableKeyFilter !== true) {
            d = c.baseChars + "";
            var a = PartKeepr.getApplication().getSiPrefixStore();
            for (var b = 0; b < a.count(); b++) {
                d += a.getAt(b).get("symbol")
            }
            d += "�";
            if (c.allowDecimals) {
                d += c.decimalSeparator
            }
            if (c.minValue < 0) {
                d += "-"
            }
            d = Ext.String.escapeRegex(d);
            c.maskRe = new RegExp("[" + d + "]");
            if (c.autoStripChars) {
                c.stripCharsRe = new RegExp("[^" + d + "]", "gi")
            }
        }
    },
    onTriggerClick: function () {
        this.expand();
        var a = this.picker.getNode(this.siPrefix);
        if (a) {
            this.picker.highlightItem(a);
            this.picker.listEl.scrollChildIntoView(a, false)
        }
    },
    getStore: function () {
        if (this.store) {
            return this.store
        }
        return PartKeepr.getApplication().getSiPrefixStore()
    },
    setStore: function (a) {
        if (this.picker) {
            this.picker.bindStore(a)
        } else {
            this.store = a
        }
    },
    createPicker: function () {
        var b = new Ext.XTemplate('<tpl for=".">', '<div class="thumb-wrap">', "{symbol} {prefix}", "</div>", "</tpl>");
        var a = Ext.create("PartKeepr.SiUnitList", {
            store: this.getStore(),
            singleSelect: true,
            ownerCt: this.ownerCt,
            renderTo: document.body,
            floating: true,
            maxHeight: 300,
            shadow: "sides",
            focusOnToFront: false,
            hidden: true,
            focusOnShow: true,
            displayField: "symbol",
            isteners: {
                scope: this,
                itemclick: this.onSelect
            }
        });
        this.mon(a, {
            itemclick: this.onSelect,
            scope: this
        });
        return a
    },
    onSelect: function (a, c) {
        var b = this.getValue();
        b.symbol = c.get("symbol");
        b.power = c.get("power");
        b.siprefix_id = c.get("id");
        this.setValue(b);
        this.collapse()
    },
    getErrors: function (c) {
        var b = this,
            f = b.callParent(arguments),
            e = Ext.String.format,
            a, d;
        d = Ext.isDefined(c) ? c : this.processRawValue(this.getRawValue());
        c = d.value;
        if (c.length < 1) {
            return f
        }
        c = String(c).replace(b.decimalSeparator, ".");
        if (isNaN(c)) {
            f.push(e(b.nanText, c))
        }
        a = b.parseValue(c);
        if (b.minValue === 0 && a < 0) {
            f.push(this.negativeText)
        } else {
            if (a < b.minValue) {
                f.push(e(b.minText, b.minValue))
            }
        }
        if (a > b.maxValue) {
            f.push(e(b.maxText, b.maxValue))
        }
        return f
    },
    rawToValue: function (b) {
        var a;
        if (Ext.isObject(b)) {
            a = b.value
        } else {
            a = b
        }
        return this.fixPrecision(this.parseValue(a)) || a || null
    },
    valueToRaw: function (c) {
        var b = this,
            a = b.decimalSeparator;
        c = b.parseValue(c);
        c = b.fixPrecision(c);
        c = Ext.isNumber(c) ? c : parseFloat(String(c).replace(a, "."));
        c = isNaN(c) ? "" : String(c).replace(".", a);
        if (Ext.isObject(this.siPrefix) && this.siPrefix.get("symbol") !== "") {
            return c + " " + this.siPrefix.get("symbol")
        } else {
            return c
        }
    },
    onChange: function () {
        var b = this,
            c = b.getValue(),
            a = c === null;
        b.callParent(arguments)
    },
    getValue: function () {
        var a = this.callParent(arguments);
        if (this.siPrefix) {
            return {
                value: a,
                symbol: this.siPrefix.get("symbol"),
                power: this.siPrefix.get("power"),
                siprefix_id: this.siPrefix.get("id")
            }
        } else {
            return {
                value: a,
                symbol: "",
                power: 1,
                siprefix_id: null
            }
        }
    },
    setMinValue: function (a) {
        this.minValue = Ext.Number.from(a, Number.NEGATIVE_INFINITY)
    },
    setMaxValue: function (a) {
        this.maxValue = Ext.Number.from(a, Number.MAX_VALUE)
    },
    parseValue: function (a) {
        a = parseFloat(String(a).replace(this.decimalSeparator, "."));
        return isNaN(a) ? null : a
    },
    fixPrecision: function (d) {
        var c = this,
            b = isNaN(d),
            a = c.decimalPrecision;
        if (b || !d) {
            return b ? "" : d
        } else {
            if (!c.allowDecimals || a <= 0) {
                a = 0
            }
        }
        return parseFloat(Ext.Number.toFixed(parseFloat(d), a))
    },
    beforeBlur: function () {
        var b = this,
            a = b.parseValue(b.getRawValue());
        if (!Ext.isEmpty(a)) {
            b.setValue(a)
        }
    },
    findSiPrefix: function (d) {
        var a = PartKeepr.getApplication().getSiPrefixStore();
        var c;
        for (var b = 0; b < a.count(); b++) {
            c = a.getAt(b).get("symbol");
            if (c !== "") {
                if (strpos(d, c) !== false) {
                    return a.getAt(b)
                }
            } else {
                emptyPrefix = a.getAt(b)
            }
        }
        if (emptyPrefix) {
            return emptyPrefix
        } else {
            return null
        }
    },
    setValue: function (a) {
        if (Ext.isObject(a)) {
            this.siPrefix = PartKeepr.getApplication().getSiPrefixStore().getById(a.siprefix_id);
            return this.callParent([a.value])
        } else {
            return a
        }
    },
    processRawValue: function (c) {
        var b;
        c = PartKeepr.getApplication().convertMicroToMu(c);
        var a = this.findSiPrefix(c);
        this.siPrefix = a;
        if (a !== null) {
            c = str_replace(a.get("symbol"), "", c);
            return {
                value: c,
                symbol: a.get("symbol"),
                power: a.get("power"),
                siprefix_id: a.get("id")
            }
        } else {
            return {
                value: c,
                symbol: "",
                power: 0,
                siprefix_id: null
            }
        }
    }
});
Ext.define("PartKeepr.PartParameterComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.PartParameterComboBox",
    displayField: "name",
    valueField: "name",
    autoSelect: false,
    allowBlank: false,
    queryMode: "local",
    triggerAction: "all",
    forceSelection: false,
    editable: true,
    initComponent: function () {
        this.store = Ext.create("Ext.data.Store", {
            fields: [{
                name: "name"
            }],
            proxy: {
                type: "ajax",
                url: PartKeepr.getBasePath() + "/Part/getPartParameterNames",
                reader: {
                    type: "json",
                    root: "response.data"
                }
            }
        });
        this.store.load();
        this.store.on("beforeload", function () {
            this._oldValue = this.getValue()
        }, this);
        this.store.on("load", function () {
            this.setValue(this._oldValue)
        }, this);
        this.callParent()
    }
});
Ext.define("PartKeepr.RemotePartComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.RemotePartComboBox",
    displayField: "name",
    valueField: "id",
    queryMode: "remote",
    triggerAction: "all",
    typeAhead: true,
    typeAheadDelay: 100,
    pageSize: 30,
    minChars: 2,
    forceSelection: true,
    initComponent: function () {
        this.store = Ext.create("Ext.data.Store", {
            model: "PartKeepr.Part",
            proxy: PartKeepr.getRESTProxy("Part"),
            autoLoad: true
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.ResistorDisplay", {
    extend: "Ext.draw.Component",
    alias: "widget.ResistorDisplay",
    viewBox: false,
    initComponent: function () {
        this.circle = Ext.create("Ext.draw.Sprite", {
            type: "circle",
            fill: "#79BB3F",
            radius: 100,
            x: 100,
            y: 100
        });
        this.items = [this.circle];
        this.callParent();
        this.circle = this.surface
    }
});
Ext.define("PartKeepr.WebcamPanel", {
    extend: "Ext.panel.Panel",
    alias: "widget.WebcamPanel",
    initComponent: function () {
        this.takePhotoButton = Ext.create("Ext.button.Button", {
            text: i18n("Take picture and upload"),
            icon: "resources/fugue-icons/icons/webcam.png",
            handler: this.takePhoto
        });
        this.bbar = Ext.create("Ext.toolbar.Toolbar", {
            enableOverflow: true,
            items: [this.takePhotoButton]
        });
        this.on("afterrender", this.renderWebcam, this);
        this.addEvents("uploadComplete");
        this.callParent()
    },
    renderWebcam: function (a) {
        webcam.set_swf_url("resources/webcam.swf");
        webcam.set_quality(90);
        webcam.set_api_url(PartKeepr.getBasePath() + "?service=TempFile&call=uploadCam&session=" + PartKeepr.getApplication().getSession());
        webcam.set_shutter_sound(false);
        webcam.set_hook("onComplete", Ext.bind(this.onUploadComplete, this));
        a.body.insertHtml("beforeEnd", webcam.get_html(640, 480, 640, 480))
    },
    takePhoto: function () {
        webcam.snap();
        this.takePhotoButton.disable();
        this.takePhotoButton.setText(i18n("Uploading..."))
    },
    onUploadComplete: function (b) {
        var a = Ext.decode(b);
        webcam.reset();
        this.fireEvent("uploadComplete", a.response)
    }
});
Ext.define("PartKeepr.ResistorCalculator", {
    extend: "Ext.window.Window",
    alias: "widget.ResistorCalculator",
    width: 300,
    height: 300,
    layout: "fit",
    initComponent: function () {
        this.resistorDisplay = Ext.create("PartKeepr.ResistorDisplay", {
            viewBox: false
        });
        this.items = [this.resistorDisplay];
        this.callParent()
    }
});
Ext.define("PartKeepr.RemoteImageFieldLayout", {
    alias: ["layout.remoteimagefield"],
    extend: "Ext.layout.component.field.Field",
    type: "remoteimagefield",
    sizeBodyContents: function (d, b) {
        var e = this,
            a = e.owner,
            g = a.inputEl,
            c = a.triggerWrap,
            f = a.getTriggerWidth();
        if (a.hideTrigger || a.readOnly || f > 0) {
            e.setElementSize(g, Ext.isNumber(d) ? d - f : d);
            c.setWidth(f)
        }
    }
});
Ext.define("PartKeepr.DistributorComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.DistributorComboBox",
    displayField: "name",
    valueField: "id",
    autoSelect: true,
    queryMode: "local",
    triggerAction: "all",
    forceSelection: true,
    editable: true,
    ignoreQuery: false,
    initComponent: function () {
        this.store = PartKeepr.getApplication().getDistributorStore();
        this.store.on("beforeload", function () {
            this._oldValue = this.getValue()
        }, this);
        this.store.on("load", function () {
            this.setValue(this._oldValue)
        }, this);
        this.callParent()
    },
    onTriggerClick: function () {
        if (!this.ignoreQuery) {
            this.callParent()
        } else {
            var a = this;
            if (!a.readOnly && !a.disabled) {
                if (a.isExpanded) {
                    a.collapse()
                } else {
                    a.onFocus({});
                    a.expand()
                }
                a.inputEl.focus()
            }
        }
    }
});
Ext.define("PartKeepr.ConnectionButton", {
    extend: "Ext.Button",
    connectedIcon: "frontend/administrator/resources/silkicons/connect.png",
    disconnectedIcon: "frontend/administrator/resources/silkicons/disconnect.png",
    cls: "x-btn-icon",
    icon: "frontend/administrator/resources/silkicons/disconnect.png",
    setConnected: function () {
        this.setIcon(this.connectedIcon)
    },
    setDisconnected: function () {
        this.setIcon(this.disconnectedIcon)
    }
});
Ext.define("PartKeepr.FootprintComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.FootprintComboBox",
    displayField: "name",
    valueField: "id",
    autoSelect: true,
    queryMode: "local",
    triggerAction: "all",
    forceSelection: true,
    editable: true,
    initComponent: function () {
        this.store = PartKeepr.getApplication().getFootprintStore();
        this.store.on("beforeload", function () {
            this._oldValue = this.getValue()
        }, this);
        this.store.on("load", function () {
            this.setValue(this._oldValue)
        }, this);
        this.callParent()
    }
});
Ext.define("PartKeepr.RemoteImageField", {
    extend: "Ext.form.field.Base",
    alias: "widget.remoteimagefield",
    type: "remoteimagefield",
    imageWidth: 32,
    imageHeight: 32,
    fieldSubTpl: ['<img id="{cmpId}-imgEl" style="{size}" class="remoteimagefield"/>',
    {
        compiled: true,
        disableFormats: true
    }],
    initComponent: function () {
        this.minHeight = this.imageHeight;
        this.minWidth = this.imageWidth;
        this.imageId = Ext.id("remoteimagefield");
        this.callParent()
    },
    getSubTplData: function () {
        return {
            cmpId: this.id,
            size: "height:" + this.imageHeight + "px;width:" + this.imageWidth + "px;",
            imageid: this.imageId
        }
    },
    onRender: function () {
        var a = this;
        a.onLabelableRender();
        a.addChildEls("imgEl");
        a.callParent(arguments)
    },
    afterRender: function () {
        this.imgEl.dom.src = this.getImageURL();
        this.imgEl.on("click", this.onClick, this)
    },
    onClick: function () {
        var a = Ext.create("PartKeepr.FileUploadDialog", {
            imageUpload: true
        });
        a.on("fileUploaded", this.onFileUploaded, this);
        a.show()
    },
    onFileUploaded: function (a) {
        this.setValue("TMP:" + a.id)
    },
    getImageURL: function () {
        var a;
        if (strpos(this.value, "TMP:") !== false) {
            a = "id=0&tmpId=" + str_replace("TMP:", "", this.value)
        } else {
            a = "id=" + this.value
        }
        return PartKeepr.getImagePath() + "?" + a + "&type=" + this.imageType + "&w=" + this.imageWidth + "&h=" + this.imageHeight + "&m=fitpadding&_dc=" + Ext.Date.now()
    },
    setValue: function (b) {
        var a = this;
        this.setRawValue(b);
        this.value = b;
        if (this.rendered) {
            this.imgEl.dom.src = this.getImageURL()
        }
        return this
    }
});
Ext.define("PartKeepr.SiUnitList", {
    extend: "Ext.view.BoundList",
    alias: "widget.siunitlist",
    getInnerTpl: function (a) {
        return '<span style="display: inline-block; width: 15px;">{' + a + '}</span><span style="display: inline-block; width: 40px;">{prefix}</span>(10<sup>{power}</span>)'
    }
});
Ext.define("PartKeepr.FadingButton", {
    extend: "Ext.Button",
    initComponent: function () {
        this.callParent()
    },
    startFading: function () {
        var a = this.getEl().down(".x-btn-inner");
        a.animate({
            duration: 1000,
            iterations: 1,
            listeners: {
                afteranimate: function () {
                    if (this.fadeRunning) {
                        Ext.defer(this.startFading, 100, this)
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
            }
        });
        this.fadeRunning = true
    },
    stopFading: function () {
        this.fadeRunning = false
    },
    isFading: function () {
        var a = this.getEl().down(".x-btn-inner");
        if (a.getActiveAnimation() === false) {
            return false
        }
        return true
    }
});
Ext.define("PartKeepr.SystemNoticeButton", {
    extend: "PartKeepr.FadingButton",
    icon: "resources/fugue-icons/icons/service-bell.png",
    tooltip: i18n("Unacknowledged System Notices"),
    initComponent: function () {
        this.callParent();
        this.on("render", this.startFading, this);
        this.on("click", this.onClick, this)
    },
    onClick: function () {
        PartKeepr.getApplication().menuBar.showSystemNotices()
    }
});
Ext.define("PartKeepr.PartUnitComboBox", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.PartUnitComboBox",
    displayField: "name",
    valueField: "id",
    autoSelect: true,
    queryMode: "local",
    triggerAction: "all",
    forceSelection: true,
    editable: true,
    initComponent: function () {
        this.store = PartKeepr.getApplication().getPartUnitStore();
        this.store.on("beforeload", function () {
            this._oldValue = this.getValue()
        }, this);
        this.store.on("load", function () {
            this.setValue(this._oldValue)
        }, this);
        this.callParent()
    }
});
Ext.define("PartKeepr.SessionManager", {
    extend: "Ext.util.Observable",
    session: null,
    loginDialog: null,
    constructor: function (a) {
        this.addEvents({
            login: true
        });
        this.callParent(arguments)
    },
    login: function (b, a) {
        this.loginDialog = Ext.create("PartKeepr.LoginDialog");
        if (b && a) {
            this.onLogin(b, a)
        } else {
            this.loginDialog.on("login", this.onLogin, this);
            this.loginDialog.show()
        }
    },
    logout: function () {
        this.session = null
    },
    onLogin: function (c, b) {
        var a = new PartKeepr.ServiceCall("Auth", "login");
        a.setParameter("username", c);
        a.setParameter("password", md5(b));
        a.enableAnonymous();
        a.setHandler(Ext.bind(this.onAfterLogin, this));
        a.doCall()
    },
    onAfterLogin: function (a) {
        this.setSession(a.sessionid);
        this.loginDialog.destroy();
        PartKeepr.getApplication().setAdmin(a.admin);
        PartKeepr.getApplication().setUsername(a.username);
        this.fireEvent("login")
    },
    setSession: function (a) {
        this.session = a
    },
    getSession: function () {
        return this.session
    }
});
Ext.define("PartKeepr.CurrentStatisticsPanel", {
    extend: "Ext.panel.Panel",
    width: 400,
    height: 250,
    title: i18n("Current Statistics"),
    bodyStyle: {
        padding: "5px"
    },
    layout: "fit",
    initComponent: function () {
        this.tpl = new Ext.XTemplate("<h1>" + i18n("Current Statistics") + "</h1>", "<table>", "<tr>", '<td style="width: 200px;" class="o">' + i18n("Different Parts") + ":</td>", '<td style="width: 200px;" class="o">{partCount}</td>', "</tr>", "<tr>", '<td style="width: 200px;" class="e">' + i18n("Total Part Value") + ":</td>", '<td style="width: 200px;" class="e">{totalPrice}</td>', "</tr>", "<tr>", '<td style="width: 200px;" class="o">' + i18n("Average Part Value") + ":</td>", '<td style="width: 200px;" class="o">{averagePrice}</td>', "</tr>", "<tr>", '<td style="width: 200px;" class="e">' + i18n("Parts with price") + ":</td>", '<td style="width: 200px;" class="e">{partsWithPrice}</td>', "</tr>", "<tr>", '<td style="width: 200px;" class="o">' + i18n("Parts without price") + ":</td>", '<td style="width: 200px;" class="o">{partsWithoutPrice}</td>', "</tr>", "<tr>", '<td class="e">' + i18n("Categories") + ":</td>", '<td class="e">{categoryCount}</td>', "</tr>", "</table>", "<h1>" + i18n("Counts per Unit") + "</h1>", "<table>", '<tpl for="units">', "<tr>", '<td style="width: 200px;" class="{[xindex % 2 === 0 ? "e" : "o"]}">{name}</td>', '<td style="width: 200px;" class="{[xindex % 2 === 0 ? "e" : "o"]}">{stockLevel}</td>', "</tr>", "</tpl>", "</table>");
        this.tbButtons = [{
            text: i18n("Refresh"),
            handler: this.loadStats,
            scope: this
        }, {
            text: i18n("Close"),
            handler: this.close,
            scope: this
        }];
        this.dockedItems = [{
            xtype: "toolbar",
            dock: "bottom",
            ui: "footer",
            items: this.tbButtons
        }];
        this.view = Ext.create("Ext.panel.Panel", {
            autoScroll: true
        });
        this.items = this.view;
        this.callParent();
        this.loadStats()
    },
    loadStats: function () {
        var a = new PartKeepr.ServiceCall("Statistic", "getCurrentStats");
        a.setHandler(Ext.bind(this.onStatsLoaded, this));
        a.doCall()
    },
    onStatsLoaded: function (a) {
        this.tpl.overwrite(this.view.getTargetEl(), a)
    }
});
Ext.define("PartKeepr.StatisticsChartPanel", {
    extend: "Ext.form.Panel",
    title: i18n("Statistics Chart"),
    layout: "anchor",
    bodyStyle: "background:#DBDBDB;padding: 15px;",
    initComponent: function () {
        this.chart = Ext.create("PartKeepr.StatisticsChart", {
            anchor: "100% -60"
        });
        this.dateSelector1 = Ext.create("Ext.form.field.Date", {
            style: "margin-top: 10px",
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
        this.items = [this.chart, this.dateSelector1, this.dateSelector2];
        this.reloadDates();
        this.callParent()
    },
    onDateChanged: function () {
        this.chart.setStart(this.dateSelector1.getValue());
        this.chart.setEnd(this.dateSelector2.getValue());
        this.chart.store.load()
    },
    reloadDates: function () {
        var a = new PartKeepr.ServiceCall("Statistic", "getStatisticRange");
        a.setHandler(Ext.bind(this.onReloadDates, this));
        a.doCall()
    },
    onReloadDates: function (b) {
        if (b.data.start === null || b.data.end === null) {
            Ext.Msg.alert(i18n("Unable to retrieve the statistic data"), i18n("The system was unable to retrieve the statistic data. The most probable cause is that the CreateStatisticSnapshot.php cronjob is not running."));
            return
        }
        var c = Ext.Date.parse(b.data.start, "Y-m-d H:i:s");
        var a = Ext.Date.parse(b.data.end, "Y-m-d H:i:s");
        this.dateSelector1.setMinValue(c);
        this.dateSelector1.setMaxValue(a);
        this.dateSelector1.suspendEvents();
        this.dateSelector1.setValue(c);
        this.dateSelector1.resumeEvents();
        this.dateSelector2.setMinValue(c);
        this.dateSelector2.setMaxValue(a);
        this.dateSelector2.suspendEvents();
        this.dateSelector2.setValue(a);
        this.dateSelector2.resumeEvents();
        this.chart.setStart(c);
        this.chart.setEnd(a);
        this.chart.store.load()
    }
});
Ext.define("PartKeepr.StatisticsChart", {
    extend: "Ext.chart.Chart",
    animate: true,
    shadow: true,
    style: "border: 1px solid #AAA;background-color: white;box-shadow: 5px 5px 0px #aaa",
    legend: {
        position: "right"
    },
    theme: "Base",
    series: [{
        type: "line",
        highlight: {
            size: 7,
            radius: 7
        },
        axis: "left",
        xField: "start",
        yField: "parts",
        tips: {
            trackMouse: true,
            width: 170,
            height: 28,
            renderer: function (b, a) {
                this.setTitle(Ext.Date.format(b.get("start"), "Y-m-d") + ": " + b.get("parts") + " " + i18n("Parts"))
            }
        },
        title: i18n("Parts"),
        markerConfig: {
            type: "cross",
            size: 4,
            radius: 4,
            "stroke-width": 0
        }
    }, {
        type: "line",
        highlight: {
            size: 7,
            radius: 7
        },
        tips: {
            trackMouse: true,
            width: 170,
            height: 28,
            renderer: function (b, a) {
                this.setTitle(Ext.Date.format(b.get("start"), "Y-m-d") + ": " + b.get("categories") + " " + i18n("Categories"))
            }
        },
        axis: "left",
        title: i18n("Categories"),
        smooth: true,
        xField: "start",
        yField: "categories",
        markerConfig: {
            type: "circle",
            size: 4,
            radius: 4,
            "stroke-width": 0
        }
    }],
    initComponent: function () {
        this.axis1 = {
            type: "Numeric",
            minimum: 0,
            position: "left",
            fields: ["parts", "categories"],
            title: i18n("Count"),
            minorTickSteps: 1,
            grid: {
                odd: {
                    opacity: 1,
                    fill: "#eee",
                    stroke: "#bbb",
                    "stroke-width": 0.5
                },
                even: {
                    opacity: 1,
                    stroke: "#bbb",
                    "stroke-width": 0.5
                }
            }
        };
        this.axis2 = {
            type: "Time",
            dateFormat: "Y-m-d",
            position: "bottom",
            aggregateOp: "avg",
            fields: ["start"],
            title: i18n("Date"),
            grid: true
        };
        this.axes = [this.axis1, this.axis2];
        this.store = Ext.create("Ext.data.Store", {
            model: "PartKeepr.StatisticSample",
            proxy: {
                type: "ajax",
                reader: {
                    type: "json",
                    root: "response.data"
                },
                url: "service.php",
                extraParams: {
                    service: "Statistic",
                    call: "getSampledStatistics",
                    startDateTime: "2011-01-01 00:00:00",
                    endDateTime: "2011-12-01 23:59:59"
                },
                headers: {
                    session: PartKeepr.getApplication().getSession()
                }
            },
            autoLoad: false
        });
        this.callParent()
    },
    setStart: function (a) {
        if (!(a instanceof Date)) {
            return
        }
        this.store.getProxy().extraParams.startDateTime = Ext.Date.format(a, "Y-m-d H:i:s")
    },
    setEnd: function (a) {
        if (!(a instanceof Date)) {
            return
        }
        a.setHours(23);
        a.setMinutes(59);
        a.setSeconds(59);
        this.store.getProxy().extraParams.endDateTime = Ext.Date.format(a, "Y-m-d H:i:s")
    }
});
PartKeepr.CategoryTreeStore = Ext.define("CategoryTreeStore", {
    extend: "Ext.data.TreeStore",
    model: "PartKeepr.Category",
    proxy: {
        type: "ajax",
        url: PartKeepr.getBasePath() + "/Category",
        method: "POST",
        extraParams: {
            call: "getCategories"
        },
        reader: {
            type: "json",
            root: "response"
        }
    },
    root: {
        text: "Ext JS",
        id: "src",
        expanded: true
    },
    constructor: function () {
        this.proxy.extraParams.session = PartKeepr.getSession();
        this.callParent()
    },
    folderSort: true
});
Ext.define("PartKeepr.LoginDialog", {
    extend: "Ext.Window",
    title: i18n("PartKeepr: Login"),
    width: 400,
    height: 125,
    modal: true,
    resizable: false,
    layout: "anchor",
    bodyStyle: "padding: 5px;",
    initComponent: function () {
        this.loginField = Ext.ComponentMgr.create({
            xtype: "textfield",
            value: "",
            fieldLabel: i18n("Username"),
            anchor: "100%"
        });
        this.passwordField = Ext.ComponentMgr.create({
            xtype: "textfield",
            inputType: "password",
            value: "",
            fieldLabel: i18n("Password"),
            anchor: "100%"
        });
        Ext.apply(this, {
            keys: [{
                key: Ext.EventObject.ENTER,
                handler: this.login,
                scope: this
            }],
            items: [this.loginField, this.passwordField],
            dockedItems: [{
                xtype: "toolbar",
                enableOverflow: true,
                dock: "bottom",
                ui: "footer",
                pack: "start",
                defaults: {
                    minWidth: 100
                },
                items: [{
                    text: i18n("Connect"),
                    icon: "frontend/administrator/resources/silkicons/connect.png",
                    handler: Ext.bind(this.login, this)
                }, {
                    text: i18n("Close"),
                    handler: Ext.bind(this.close, this),
                    icon: "frontend/administrator/resources/silkicons/cancel.png"
                }]
            }]
        });
        this.callParent(arguments);
        this.on("show", function () {
            this.loginField.focus()
        }, this)
    },
    login: function () {
        this.fireEvent("login", this.loginField.getValue(), this.passwordField.getValue())
    }
});
Ext.define("PartKeepr.EditorComponent", {
    extend: "Ext.panel.Panel",
    alias: "widget.EditorComponent",
    layout: "border",
    padding: 5,
    border: false,
    navigationClass: null,
    editorClass: null,
    store: null,
    model: null,
    deleteMessage: i18n("Do you really wish to delete the item %s?"),
    deleteTitle: i18n("Delete Item"),
    newItemText: i18n("New Item"),
    initComponent: function () {
        this.navigation = Ext.create(this.navigationClass, {
            region: "west",
            width: 265,
            split: true,
            store: this.store
        });
        this.navigation.on("itemAdd", this.newRecord, this);
        this.navigation.on("itemDelete", this.confirmDelete, this);
        this.navigation.on("itemEdit", this.startEdit, this);
        this.editorTabPanel = Ext.create("Ext.tab.Panel", {
            region: "center",
            layout: "fit",
            plugins: Ext.create("Ext.ux.TabCloseMenu")
        });
        this.items = [this.navigation, this.editorTabPanel];
        this.callParent()
    },
    newRecord: function (b) {
        Ext.apply(b, {});
        var a = this.createEditor(this.newItemText);
        a.newItem(b);
        this.editorTabPanel.add(a).show()
    },
    startEdit: function (c) {
        var b = this.findEditor(c);
        if (b !== null) {
            b.show();
            return
        }
        var a = Ext.ModelManager.getModel(this.model);
        a.load(c, {
            scope: this,
            success: function (d, e) {
                b = this.createEditor(d.getRecordName());
                b.editItem(d);
                this.editorTabPanel.add(b).show()
            }
        })
    },
    findEditor: function (b) {
        for (var a = 0; a < this.editorTabPanel.items.getCount(); a++) {
            if (this.editorTabPanel.items.getAt(a).getRecordId() == b) {
                return this.editorTabPanel.items.getAt(a)
            }
        }
        return null
    },
    createEditor: function (b) {
        var a = Ext.create(this.editorClass, {
            store: this.store,
            title: b,
            model: this.model,
            closable: true,
            listeners: {
                editorClose: Ext.bind(function (c) {
                    this.editorTabPanel.remove(c)
                }, this)
            }
        });
        a.on("itemSaved", this.onItemSaved, this);
        return a
    },
    confirmDelete: function () {
        var a = this.navigation.getSelectionModel().getLastSelected();
        var b;
        if (a.getRecordName) {
            b = a.getRecordName()
        } else {
            b = a.get("name")
        }
        Ext.Msg.confirm(this.deleteTitle, sprintf(this.deleteMessage, b), function (c) {
            if (c == "yes") {
                this.deleteRecord(a)
            }
        }, this)
    },
    deleteRecord: function (b) {
        var a = this.findEditor(b.get("id"));
        if (a !== null) {
            this.editorTabPanel.remove(a)
        }
        b.destroy();
        this.store.load()
    },
    createStore: function (a) {
        Ext.Object.merge(a, {
            autoLoad: true,
            model: this.model,
            autoSync: false,
            remoteFilter: true,
            remoteSort: true,
            pageSize: 15
        });
        this.store = Ext.create("Ext.data.Store", a);
        this.store.on("write", function (c, b) {
            var d = b.wasSuccessful();
            if (d) {
                Ext.each(b.records, function (e) {
                    if (e.dirty) {
                        e.commit()
                    }
                })
            }
        })
    },
    getStore: function () {
        return this.store
    },
    onItemSaved: function (a) {
        this.navigation.syncChanges(a)
    }
});
Ext.define("PartKeepr.SystemNoticeEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.SystemNoticeEditorComponent",
    navigationClass: "PartKeepr.SystemNoticeGrid",
    editorClass: "PartKeepr.SystemNoticeEditor",
    newItemText: i18n("New System Notice"),
    model: "PartKeepr.SystemNotice",
    initComponent: function () {
        this.createStore({
            sorters: [{
                proxy: PartKeepr.getRESTProxy("SystemNotice"),
                property: "date",
                direction: "DESC"
            }]
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.FootprintEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.FootprintEditorComponent",
    navigationClass: "PartKeepr.FootprintTree",
    editorClass: "PartKeepr.FootprintEditor",
    newItemText: i18n("New Footprint"),
    model: "PartKeepr.Footprint",
    initComponent: function () {
        this.createStore({
            proxy: PartKeepr.getRESTProxy("Footprint"),
            sorters: [{
                property: "name",
                direction: "ASC"
            }]
        });
        this.callParent()
    },
    deleteRecord: function (c) {
        var b = this.findEditor(c.get("footprintId"));
        if (b !== null) {
            this.editorTabPanel.remove(b)
        }
        var a = new PartKeepr.ServiceCall("Footprint", "destroy");
        a.setParameter("id", c.get("footprintId"));
        a.setHandler(Ext.bind(function () {
            var d = PartKeepr.getApplication().getFootprintStore().find("id", c.get("footprintId"));
            PartKeepr.getApplication().getFootprintStore().removeAt(d);
            this.navigation.loadCategories()
        }, this));
        a.doCall()
    }
});
Ext.define("PartKeepr.ProjectEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.ProjectEditorComponent",
    navigationClass: "PartKeepr.ProjectGrid",
    editorClass: "PartKeepr.ProjectEditor",
    newItemText: i18n("New Project"),
    model: "PartKeepr.Project",
    initComponent: function () {
        this.createStore({
            sorters: [{
                proxy: PartKeepr.getRESTProxy("Project"),
                property: "name",
                direction: "ASC"
            }]
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.ManufacturerEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.ManufacturerEditorComponent",
    navigationClass: "PartKeepr.ManufacturerGrid",
    editorClass: "PartKeepr.ManufacturerEditor",
    newItemText: i18n("New Manufacturer"),
    model: "PartKeepr.Manufacturer",
    initComponent: function () {
        this.createStore({
            sorters: [{
                proxy: PartKeepr.getRESTProxy("Manufacurer"),
                property: "name",
                direction: "ASC"
            }]
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.UserEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.UserEditorComponent",
    navigationClass: "PartKeepr.UserGrid",
    editorClass: "PartKeepr.UserEditor",
    newItemText: i18n("New User"),
    deleteMessage: i18n("Do you really wish to delete the user '%s'?"),
    deleteTitle: i18n("Delete User"),
    model: "PartKeepr.User",
    initComponent: function () {
        this.createStore({
            sorters: [{
                proxy: PartKeepr.getRESTProxy("User"),
                property: "username",
                direction: "ASC"
            }]
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.PartUnitEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.PartUnitEditorComponent",
    navigationClass: "PartKeepr.PartUnitGrid",
    editorClass: "PartKeepr.PartUnitEditor",
    newItemText: i18n("New Part Measurement Unit"),
    deleteMessage: i18n("Do you really wish to delete the part measurement unit'%s'?"),
    deleteTitle: i18n("Delete Part Measurement Unit"),
    model: "PartKeepr.PartUnit",
    initComponent: function () {
        this.createStore({
            sorters: [{
                proxy: PartKeepr.getRESTProxy("PartUnit"),
                property: "name",
                direction: "ASC"
            }]
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.UnitEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.UnitEditorComponent",
    navigationClass: "PartKeepr.UnitGrid",
    editorClass: "PartKeepr.UnitEditor",
    newItemText: i18n("New Unit"),
    deleteMessage: i18n("Do you really wish to delete the unit'%s'?"),
    deleteTitle: i18n("Delete Unit"),
    model: "PartKeepr.Unit",
    initComponent: function () {
        this.createStore({
            sorters: [{
                proxy: PartKeepr.getRESTProxy("Unit"),
                property: "name",
                direction: "ASC"
            }]
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.DistributorEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.DistributorEditorComponent",
    navigationClass: "PartKeepr.DistributorGrid",
    editorClass: "PartKeepr.DistributorEditor",
    newItemText: i18n("New Distributor"),
    model: "PartKeepr.Distributor",
    initComponent: function () {
        this.createStore({
            proxy: PartKeepr.getRESTProxy("Distributor"),
            sorters: [{
                property: "name",
                direction: "ASC"
            }]
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.StorageLocationEditorComponent", {
    extend: "PartKeepr.EditorComponent",
    alias: "widget.StorageLocationEditorComponent",
    navigationClass: "PartKeepr.StorageLocationGrid",
    editorClass: "PartKeepr.StorageLocationEditor",
    newItemText: i18n("New Storage Location"),
    model: "PartKeepr.StorageLocation",
    initComponent: function () {
        this.createStore({
            sorters: [{
                proxy: PartKeepr.getRESTProxy("StorageLocation"),
                property: "name",
                direction: "ASC"
            }]
        });
        this.callParent()
    }
});
Ext.define("PartKeepr.Editor", {
    extend: "Ext.form.Panel",
    alias: "widget.Editor",
    trackResetOnLoad: true,
    bodyStyle: "background:#DBDBDB;padding: 10px;",
    record: null,
    saveText: i18n("Save"),
    cancelText: i18n("Cancel"),
    model: null,
    layout: "anchor",
    change: false,
    autoScroll: true,
    defaults: {
        anchor: "100%",
        labelWidth: 150
    },
    enableButtons: true,
    syncDirect: false,
    onFieldChange: function () {
        return
    },
    initComponent: function () {
        if (this.enableButtons) {
            this.saveButton = Ext.create("Ext.button.Button", {
                text: this.saveText,
                icon: "resources/fugue-icons/icons/disk.png",
                handler: Ext.bind(this._onItemSave, this)
            });
            this.cancelButton = Ext.create("Ext.button.Button", {
                text: this.cancelText,
                icon: "resources/silkicons/cancel.png",
                handler: Ext.bind(this.onCancelEdit, this)
            });
            this.bottomToolbar = Ext.create("Ext.toolbar.Toolbar", {
                enableOverflow: true,
                margin: "10px",
                defaults: {
                    minWidth: 100
                },
                dock: "bottom",
                ui: "footer",
                items: [this.saveButton, this.cancelButton]
            });
            Ext.apply(this, {
                dockedItems: [this.bottomToolbar]
            })
        }
        this.on("dirtychange", function (b, a) {});
        this.addEvents("editorClose", "startEdit", "itemSaved", "itemSave");
        this.defaults.listeners = {
            change: Ext.bind(this.onFieldChange, this)
        };
        this.callParent()
    },
    onCancelEdit: function () {
        this.fireEvent("editorClose", this)
    },
    newItem: function (b) {
        Ext.apply(b, {});
        var a = Ext.create(this.model, b);
        this.editItem(a)
    },
    editItem: function (a) {
        this.record = a;
        this.getForm().loadRecord(this.record);
        this.show();
        if (this.record.getRecordName() !== "") {
            this._setTitle(this.record.getRecordName())
        }
        this.change = false;
        this.fireEvent("startEdit", this)
    },
    getRecordId: function () {
        if (this.record) {
            return this.record.get("id")
        } else {
            return null
        }
    },
    _onItemSave: function () {
        if (this.enableButtons) {
            this.saveButton.disable();
            Ext.defer(function () {
                this.saveButton.enable()
            }, 30000, this)
        }
        this.getForm().updateRecord(this.record);
        this.fireEvent("itemSave", this.record);
        this.record.save({
            callback: this._onSave,
            scope: this
        })
    },
    _onSave: function (a, b) {
        if (this.enableButtons) {
            this.saveButton.enable()
        }
        if (b.success === true) {
            this.record = a;
            this.fireEvent("itemSaved", this.record)
        }
    },
    _setTitle: function (a) {
        this.setTitle(a)
    }
});
Ext.define("PartKeepr.SystemNoticeEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.SystemNoticeEditor",
    saveText: i18n("Save System Notice"),
    defaults: {
        anchor: "100%",
        labelWidth: 110
    },
    layout: {
        type: "vbox",
        align: "stretch",
        pack: "start"
    },
    enableButtons: false,
    initComponent: function () {
        this.acknowledgeButton = Ext.create("Ext.button.Button", {
            text: i18n("Acknowledge Notice"),
            icon: "resources/silkicons/accept.png"
        });
        this.acknowledgeButton.on("click", this.onAcknowledgeClick, this);
        this.bottomToolbar = Ext.create("Ext.toolbar.Toolbar", {
            enableOverflow: true,
            margin: "10px",
            defaults: {
                minWidth: 100
            },
            dock: "bottom",
            ui: "footer",
            items: [this.acknowledgeButton]
        });
        this.dockedItems = new Array(this.bottomToolbar);
        this.items = [{
            xtype: "textfield",
            readOnly: true,
            name: "title",
            fieldLabel: i18n("Title")
        }, {
            xtype: "textarea",
            readOnly: true,
            flex: 1,
            name: "description",
            fieldLabel: i18n("Description")
        }, {
            xtype: "datefield",
            readOnly: true,
            hideTrigger: true,
            name: "date",
            fieldLabel: i18n("Date")
        }];
        this.callParent()
    },
    onAcknowledgeClick: function () {
        var a = new PartKeepr.ServiceCall("SystemNotice", "acknowledge");
        a.setParameter("id", this.record.get("id"));
        a.setHandler(Ext.bind(this.onAcknowledged, this));
        a.doCall()
    },
    onAcknowledged: function () {
        this.fireEvent("editorClose", this);
        this.store.load()
    }
});
Ext.define("PartKeepr.FootprintEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.FootprintEditor",
    saveText: i18n("Save Footprint"),
    layout: "column",
    syncDirect: true,
    labelWidth: 75,
    initComponent: function () {
        this.on("startEdit", this.onEditStart, this, {
            delay: 50
        });
        this.attachmentGrid = Ext.create("PartKeepr.FootprintAttachmentGrid", {
            height: 200,
            width: "100%",
            border: true
        });
        this.items = [{
            columnWidth: 1,
            minWidth: 500,
            layout: "anchor",
            xtype: "container",
            margin: "0 5 0 0",
            items: [{
                xtype: "textfield",
                name: "name",
                labelWidth: 75,
                anchor: "100%",
                fieldLabel: i18n("Name")
            }, {
                labelWidth: 75,
                xtype: "textarea",
                name: "description",
                anchor: "100%",
                fieldLabel: i18n("Description")
            }, {
                labelWidth: 75,
                xtype: "fieldcontainer",
                anchor: "100%",
                fieldLabel: i18n("Attachments"),
                items: this.attachmentGrid
            }]
        }, {
            width: 370,
            height: 250,
            xtype: "remoteimagefield",
            name: "image_id",
            imageType: "footprint",
            imageWidth: 256,
            imageHeight: 256,
            labelWidth: 75,
            fieldLabel: i18n("Image")
        }];
        this.on("itemSaved", this._onItemSaved, this);
        this.callParent()
    },
    _onItemSaved: function (a) {
        this.attachmentGrid.bindStore(a.attachments())
    },
    onEditStart: function () {
        var a = this.record.attachments();
        this.attachmentGrid.bindStore(a)
    }
});
Ext.define("PartKeepr.ProjectEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.ProjectEditor",
    saveText: i18n("Save Project"),
    defaults: {
        anchor: "100%",
        labelWidth: 110
    },
    layout: {
        type: "vbox",
        align: "stretch",
        pack: "start"
    },
    initComponent: function () {
        this.on("startEdit", this.onEditStart, this, {
            delay: 200
        });
        this.on("itemSaved", this._onItemSaved, this);
        var b = {};
        Ext.Object.merge(b, {
            autoLoad: false,
            model: "PartKeepr.ProjectPart",
            autoSync: false,
            remoteFilter: false,
            remoteSort: false
        });
        this.store = Ext.create("Ext.data.Store", b);
        this.partGrid = Ext.create("PartKeepr.ProjectPartGrid", {
            store: this.store,
            listeners: {
                edit: this.onProjectGridEdit
            }
        });
        var a = Ext.create("Ext.form.FieldContainer", {
            fieldLabel: i18n("Project Parts"),
            labelWidth: 110,
            layout: "fit",
            flex: 1,
            items: this.partGrid
        });
        this.attachmentGrid = Ext.create("PartKeepr.ProjectAttachmentGrid", {
            border: true
        });
        var c = Ext.create("Ext.form.FieldContainer", {
            fieldLabel: i18n("Attachments"),
            labelWidth: 110,
            layout: "fit",
            flex: 1,
            items: this.attachmentGrid
        });
        this.items = [{
            xtype: "textfield",
            name: "name",
            height: 20,
            fieldLabel: i18n("Project Name")
        }, {
            xtype: "textarea",
            name: "description",
            fieldLabel: i18n("Project Description"),
            height: 70
        },
        a, c];
        this.callParent()
    },
    onProjectGridEdit: function (a, b) {
        if (b.field == "part_id") {
            if (b.value === null) {
                b.record.set("part_id", b.originalValue)
            }
            var c = b.column.getEditor().store.getById(b.value);
            if (c) {
                b.record.set("part_name", c.get("name"))
            }
        }
    },
    _onItemSaved: function (a) {
        this.partGrid.bindStore(a.parts());
        this.attachmentGrid.bindStore(a.attachments())
    },
    onEditStart: function () {
        var b = this.record.parts();
        this.partGrid.bindStore(b);
        var a = this.record.attachments();
        this.attachmentGrid.bindStore(a)
    }
});
Ext.define("PartKeepr.ManufacturerEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.ManufacturerEditor",
    saveText: i18n("Save Manufacturer"),
    labelWidth: 150,
    initComponent: function () {
        this.on("startEdit", Ext.bind(this.onEditStart, this));
        this.tpl = ['<tpl for=".">', '<div class="thumb-wrap" id="{id}">', '<div class="thumb"><img src="image.php?type=iclogo&id={id}&w=64&h=64&tmpId={tmp_id}"></div>', "</div>", "</tpl>", "</tpl>", '<div class="x-clear"></div>'];
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
            style: "background-color: white",
            emptyText: "No images to display",
            height: 200,
            fieldLabel: i18n("Logos"),
            overItemCls: "x-view-over",
            componentCls: "manufacturer-ic-logos",
            itemSelector: "div.thumb-wrap",
            singleSelect: true,
            anchor: "100%",
            tpl: this.tpl,
            listeners: {
                selectionchange: Ext.bind(function (a, b) {
                    if (b.length > 0) {
                        this.deleteLogoButton.enable()
                    } else {
                        this.deleteLogoButton.disable()
                    }
                }, this)
            }
        });
        this.items = [{
            xtype: "textfield",
            name: "name",
            fieldLabel: i18n("Manufacturer Name")
        }, {
            xtype: "textarea",
            name: "address",
            fieldLabel: i18n("Address")
        }, {
            xtype: "textfield",
            name: "url",
            fieldLabel: i18n("Website")
        }, {
            xtype: "textfield",
            name: "email",
            fieldLabel: i18n("Email")
        }, {
            xtype: "textfield",
            name: "phone",
            fieldLabel: i18n("Phone")
        }, {
            xtype: "textfield",
            name: "fax",
            fieldLabel: i18n("Fax")
        }, {
            xtype: "textarea",
            name: "comment",
            fieldLabel: i18n("Comment")
        }, {
            xtype: "fieldcontainer",
            fieldLabel: i18n("Manufacturer Logos"),
            items: [{
                xtype: "panel",
                dockedItems: [{
                    xtype: "toolbar",
                    dock: "bottom",
                    items: [this.addLogoButton, this.deleteLogoButton]
                }],
                items: this.iclogoGrid
            }]
        }];
        this.on("itemSaved", this._onItemSaved, this);
        this.callParent()
    },
    _onItemSaved: function (a) {
        this.iclogoGrid.bindStore(a.iclogos())
    },
    onFileUploaded: function (a) {
        this.iclogoGrid.getStore().add({
            id: "TMP:" + a.id,
            manufacturer_id: this.record.get("id")
        })
    },
    uploadImage: function () {
        var a = Ext.create("PartKeepr.FileUploadDialog", {
            imageUpload: true
        });
        a.on("fileUploaded", Ext.bind(this.onFileUploaded, this));
        a.show()
    },
    deleteImage: function () {
        this.iclogoGrid.store.remove(this.iclogoGrid.getSelectionModel().getLastSelected())
    },
    onEditStart: function () {
        var a = this.record.iclogos();
        this.iclogoGrid.bindStore(a)
    }
});
Ext.define("PartKeepr.UserEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.UserEditor",
    saveText: i18n("Save User"),
    model: "PartKeepr.User",
    initComponent: function () {
        this.gridPanel = Ext.create("PartKeepr.UserPreferenceGrid");
        var a = Ext.create("Ext.form.FieldContainer", {
            fieldLabel: i18n("User Preferences"),
            labelWidth: 150,
            layout: "fit",
            height: 200,
            items: this.gridPanel
        });
        this.items = [{
            xtype: "textfield",
            name: "username",
            fieldLabel: i18n("User")
        }, {
            xtype: "textfield",
            inputType: "password",
            name: "password",
            fieldLabel: i18n("Password")
        },
        a];
        this.on("startEdit", this.onStartEdit, this);
        this.callParent()
    },
    onStartEdit: function () {
        this.gridPanel.store.getProxy().extraParams.user_id = this.record.get("id");
        this.gridPanel.store.load()
    },
    onItemSave: function () {
        this.gridPanel.syncPreferences();
        this.callParent()
    }
});
Ext.define("PartKeepr.PartUnitEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.PartUnitEditor",
    items: [{
        xtype: "textfield",
        name: "name",
        fieldLabel: i18n("Measurement Unit Name")
    }, {
        xtype: "textfield",
        name: "shortName",
        fieldLabel: i18n("Short Name")
    }],
    saveText: i18n("Save Part Measurement Unit")
});
Ext.define("PartKeepr.UnitEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.UnitEditor",
    saveText: i18n("Save Unit"),
    initComponent: function () {
        var b = Ext.create("Ext.selection.CheckboxModel", {
            checkOnly: true
        });
        this.gridPanel = Ext.create("PartKeepr.BaseGrid", {
            store: PartKeepr.getApplication().getSiPrefixStore(),
            selModel: b,
            columnLines: true,
            columns: [{
                text: i18n("Prefix"),
                dataIndex: "prefix",
                width: 60
            }, {
                text: i18n("Symbol"),
                dataIndex: "symbol",
                width: 60
            }, {
                text: i18n("Power"),
                dataIndex: "power",
                flex: 1,
                renderer: function (c) {
                    return "10<sup>" + c + "</sup>"
                }
            }]
        });
        var a = Ext.create("Ext.form.FieldContainer", {
            fieldLabel: i18n("Allowed SI-Prefixes"),
            labelWidth: 150,
            items: this.gridPanel
        });
        this.items = [{
            xtype: "textfield",
            name: "name",
            fieldLabel: i18n("Unit Name")
        }, {
            xtype: "textfield",
            name: "symbol",
            fieldLabel: i18n("Symbol")
        },
        a];
        this.callParent();
        this.on("startEdit", this.onStartEdit, this)
    },
    onStartEdit: function () {
        var a = this.record.prefixes().getRange();
        var d = [];
        var c = PartKeepr.getApplication().getSiPrefixStore();
        for (var b = 0; b < a.length; b++) {
            d.push(c.getAt(c.find("id", a[b].get("id"))))
        }
        Ext.defer(function () {
            this.gridPanel.getSelectionModel().select(d)
        }, 100, this)
    },
    onItemSave: function () {
        var b = this.gridPanel.getSelectionModel().getSelection();
        this.record.prefixes().removeAll(true);
        for (var a = 0; a < b.length; a++) {
            this.record.prefixes().add({
                id: b[a].get("id")
            })
        }
        this.callParent()
    }
});
Ext.define("PartKeepr.DistributorEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.DistributorEditor",
    items: [{
        xtype: "textfield",
        name: "name",
        fieldLabel: i18n("Distributor")
    }, {
        xtype: "textarea",
        name: "address",
        fieldLabel: i18n("Address")
    }, {
        xtype: "textfield",
        name: "url",
        fieldLabel: i18n("Website")
    }, {
        xtype: "textfield",
        name: "email",
        fieldLabel: i18n("Email")
    }, {
        xtype: "textfield",
        name: "phone",
        fieldLabel: i18n("Phone")
    }, {
        xtype: "textfield",
        name: "fax",
        fieldLabel: i18n("Fax")
    }, {
        xtype: "textarea",
        name: "comment",
        fieldLabel: i18n("Comment")
    }],
    saveText: i18n("Save Distributor")
});
Ext.define("PartKeepr.StorageLocationEditor", {
    extend: "PartKeepr.Editor",
    alias: "widget.StorageLocationEditor",
    saveText: i18n("Save Storage Location"),
    layout: "column",
    initComponent: function () {
        var b = {};
        Ext.Object.merge(b, {
            autoLoad: false,
            model: "PartKeepr.Part",
            autoSync: false,
            remoteFilter: true,
            remoteSort: true,
            proxy: PartKeepr.getRESTProxy("Part"),
            pageSize: 15
        });
        this.store = Ext.create("Ext.data.Store", b);
        this.gridPanel = Ext.create("PartKeepr.BaseGrid", {
            store: this.store,
            columnLines: true,
            columns: [{
                header: i18n("Name"),
                dataIndex: "name",
                flex: 1,
                minWidth: 200,
                renderer: Ext.util.Format.htmlEncode
            }, {
                header: i18n("Qty"),
                width: 50,
                dataIndex: "stockLevel"
            }]
        });
        var a = Ext.create("Ext.form.FieldContainer", {
            fieldLabel: i18n("Contained Parts"),
            labelWidth: 110,
            layout: "fit",
            height: 246,
            items: this.gridPanel
        });
        this.items = [{
            columnWidth: 1,
            minWidth: 500,
            layout: "anchor",
            xtype: "container",
            margin: "0 5 0 0",
            items: [{
                xtype: "textfield",
                name: "name",
                labelWidth: 110,
                fieldLabel: i18n("Storage Location")
            },
            a]
        }, {
            width: 370,
            height: 250,
            xtype: "remoteimagefield",
            name: "image_id",
            imageType: "storagelocation",
            imageWidth: 256,
            imageHeight: 256,
            labelWidth: 110,
            fieldLabel: i18n("Image")
        }];
        this.on("startEdit", this.onStartEdit, this);
        this.callParent()
    },
    onStartEdit: function () {
        this.store.getProxy().extraParams.storageLocation = this.record.get("name");
        this.store.load()
    }
});
Ext.define("PartKeepr.PartEditor", {
    extend: "PartKeepr.Editor",
    model: "PartKeepr.Part",
    border: false,
    layout: "fit",
    bodyStyle: "background:#DBDBDB;",
    initComponent: function () {
        this.nameField = Ext.create("Ext.form.field.Text", {
            name: "name",
            fieldLabel: i18n("Name"),
            allowBlank: false,
            labelWidth: 150
        });
        this.storageLocationComboBox = Ext.create("PartKeepr.StorageLocationComboBox", {
            fieldLabel: i18n("Storage Location"),
            name: "storageLocation",
            allowBlank: false,
            labelWidth: 150
        });
        this.storageLocationComboBox.store.on("load", function () {
            this.getForm().isValid()
        }, this);
        var a = [this.nameField,
        {
            layout: "column",
            bodyStyle: "background:#DBDBDB",
            border: false,
            items: [{
                xtype: "numberfield",
                fieldLabel: i18n("Minimum Stock"),
                allowDecimals: false,
                allowBlank: false,
                labelWidth: 150,
                name: "minStockLevel",
                value: 0,
                columnWidth: 0.5,
                minValue: 0
            }, {
                xtype: "PartUnitComboBox",
                fieldLabel: i18n("Part Unit"),
                columnWidth: 0.5,
                margin: "0 0 0 5",
                name: "partUnit",
                value: PartKeepr.getApplication().getDefaultPartUnit().get("id")
            }]
        }, {
            xtype: "CategoryComboBox",
            fieldLabel: i18n("Category"),
            name: "category"
        },
        this.storageLocationComboBox,
        {
            xtype: "FootprintComboBox",
            fieldLabel: i18n("Footprint"),
            name: "footprint"
        }, {
            xtype: "textarea",
            fieldLabel: i18n("Comment"),
            name: "comment"
        }, {
            xtype: "textfield",
            fieldLabel: i18n("Status"),
            name: "status"
        }, {
            xtype: "checkbox",
            hideEmptyLabel: false,
            fieldLabel: "",
            boxLabel: i18n("Needs Review"),
            name: "needsReview"
        }];
        this.partDistributorGrid = Ext.create("PartKeepr.PartDistributorGrid", {
            title: i18n("Distributors"),
            iconCls: "icon-lorry",
            layout: "fit"
        });
        this.partManufacturerGrid = Ext.create("PartKeepr.PartManufacturerGrid", {
            title: i18n("Manufacturers"),
            iconCls: "icon-building",
            layout: "fit"
        });
        this.partParameterGrid = Ext.create("PartKeepr.PartParameterGrid", {
            title: i18n("Parameters"),
            iconCls: "icon-table",
            layout: "fit"
        });
        this.partAttachmentGrid = Ext.create("PartKeepr.PartAttachmentGrid", {
            title: i18n("Attachments"),
            iconCls: "icon-attach",
            layout: "fit"
        });
        if (this.partMode && this.partMode == "create") {
            this.initialStockLevel = Ext.create("Ext.form.field.Number", {
                fieldLabel: i18n("Initial Stock Level"),
                name: "initialStockLevel",
                labelWidth: 150,
                columnWidth: 0.5
            });
            this.initialStockLevelUser = Ext.create("PartKeepr.UserComboBox", {
                fieldLabel: i18n("Stock User"),
                name: "initialStockLevelUser",
                columnWidth: 0.5,
                margin: "0 0 0 5"
            });
            a.push({
                layout: "column",
                bodyStyle: "background:#DBDBDB",
                border: false,
                items: [this.initialStockLevel, this.initialStockLevelUser]
            });
            this.initialStockLevelPrice = Ext.create("Ext.form.field.Number", {
                fieldLabel: i18n("Price"),
                labelWidth: 150,
                columnWidth: 0.5,
                name: "initialStockLevelPrice"
            });
            this.initialStockLevelPricePerItem = Ext.create("Ext.form.field.Checkbox", {
                boxLabel: i18n("Per Item"),
                columnWidth: 0.5,
                margin: "0 0 0 5",
                name: "initialStockLevelPricePerItem"
            });
            a.push({
                layout: "column",
                bodyStyle: "background:#DBDBDB",
                border: false,
                items: [this.initialStockLevelPrice, this.initialStockLevelPricePerItem]
            })
        }
        this.items = {
            xtype: "tabpanel",
            border: false,
            plain: true,
            items: [{
                iconCls: "icon-brick",
                xtype: "panel",
                border: false,
                autoScroll: true,
                layout: "anchor",
                defaults: {
                    anchor: "100%",
                    labelWidth: 150
                },
                bodyStyle: "background:#DBDBDB;padding: 10px;",
                title: i18n("Basic Data"),
                items: a
            },
            this.partDistributorGrid, this.partManufacturerGrid, this.partParameterGrid, this.partAttachmentGrid]
        };
        this.on("startEdit", this.onEditStart, this, {
            delay: 200
        });
        this.on("itemSaved", this._onItemSaved, this);
        this.addEvents("partSaved", "titleChange");
        this.callParent();
        this.on("itemSave", this.onItemSave, this)
    },
    onItemSave: function () {
        var a = [],
            b;
        for (b = 0; b < this.record.distributors().getCount(); b++) {
            if (this.record.distributors().getAt(b).get("distributor_id") === 0) {
                a.push(this.record.distributors().getAt(b))
            }
        }
        if (a.length > 0) {
            this.record.distributors().remove(a)
        }
        a = [];
        for (b = 0; b < this.record.parameters().getCount(); b++) {
            if (this.record.parameters().getAt(b).get("unit_id") === 0) {
                a.push(this.record.parameters().getAt(b))
            }
        }
        if (a.length > 0) {
            this.record.parameters().remove(a)
        }
        a = [];
        for (b = 0; b < this.record.manufacturers().getCount(); b++) {
            if (this.record.manufacturers().getAt(b).get("manufacturer_id") === 0) {
                a.push(this.record.manufacturers().getAt(b))
            }
        }
        if (a.length > 0) {
            this.record.manufacturers().remove(a)
        }
        if (isNaN(this.record.get("storageLocation"))) {
            var c = this.storageLocationComboBox.getStore().findRecord("name", this.storageLocationComboBox.getValue(), 0, false, false, true);
            this.record.set("storageLocation", c.get("id"))
        }
    },
    onEditStart: function () {
        this.bindChildStores();
        this.nameField.focus();
        this.getForm().isValid()
    },
    _onItemSaved: function () {
        this.fireEvent("partSaved", this.record);
        if (this.keepOpenCheckbox.getValue() !== true) {
            this.fireEvent("editorClose", this)
        } else {
            var a = Ext.create("PartKeepr.Part", this.partDefaults);
            this.editItem(a)
        }
    },
    bindChildStores: function () {
        this.partDistributorGrid.bindStore(this.record.distributors());
        this.partManufacturerGrid.bindStore(this.record.manufacturers());
        this.partParameterGrid.bindStore(this.record.parameters());
        this.partAttachmentGrid.bindStore(this.record.attachments())
    },
    _setTitle: function (b) {
        var a;
        if (this.record.phantom) {
            a = i18n("Add Part")
        } else {
            a = i18n("Edit Part")
        }
        if (b !== "") {
            a = a + ": " + b
        }
        this.fireEvent("titleChange", a)
    }
});
Ext.define("PartKeepr.TimeDisplay", {
    extend: "Ext.Toolbar.TextItem",
    el: null,
    dt: null,
    enable: Ext.emptyFn,
    disable: Ext.emptyFn,
    focus: Ext.emptyFn,
    constructor: function () {
        var a = document.createElement("span");
        a.className = "ytb-text";
        var b = new Date();
        a.innerHTML = Ext.Date.format(b, Ext.getDateFormat());
        Ext.defer(this.onUpdate, 240, this);
        this.el = a;
        this.callParent(arguments)
    },
    onUpdate: function (b) {
        var a = new Date();
        this.setText(Ext.Date.format(a, Ext.getDateFormat()));
        delete a;
        Ext.defer(this.onUpdate, 240, this)
    }
});
Ext.define("PartKeepr.MenuBar", {
    extend: "Ext.toolbar.Toolbar",
    initComponent: function () {
        this.ui = "mainmenu";
        this.editMenu = Ext.create("Ext.menu.Menu", {
            items: [{
                text: i18n("Projects"),
                icon: "resources/fugue-icons/icons/drill.png",
                handler: this.editProjects
            }, {
                text: i18n("Footprints"),
                icon: "resources/fugue-icons/icons/fingerprint.png",
                handler: this.editFootprints
            }, {
                text: i18n("Manufacturers"),
                icon: "resources/silkicons/building.png",
                handler: this.editManufacturers
            }, {
                text: i18n("Storage Locations"),
                icon: "resources/fugue-icons/icons/wooden-box.png",
                handler: this.editStorageLocations
            }, {
                text: i18n("Distributors"),
                icon: "resources/silkicons/lorry.png",
                handler: this.editDistributors
            }, {
                text: i18n("Users"),
                id: "edit-users",
                handler: this.editUsers,
                icon: "resources/silkicons/user.png"
            }, {
                text: i18n("Part Measure Units"),
                handler: this.editPartUnits,
                icon: "resources/fugue-icons/icons/ruler.png"
            }, {
                text: i18n("Units"),
                handler: this.editUnits,
                icon: "resources/icons/unit.png"
            }]
        });
        this.viewMenu = Ext.create("Ext.menu.Menu", {
            items: [{
                text: i18n("Statistics"),
                icon: "resources/silkicons/chart_bar.png",
                menu: [{
                    text: i18n("Summary"),
                    handler: this.showStatisticsSummary,
                    icon: "resources/silkicons/chart_bar.png"
                }, {
                    text: i18n("Chart"),
                    handler: this.showStatisticsChart,
                    icon: "resources/silkicons/chart_bar.png"
                }]
            }, {
                text: i18n("System Information"),
                handler: this.showSystemInformation,
                icon: "resources/fugue-icons/icons/system-monitor.png"
            }, {
                text: i18n("Project Reports"),
                handler: this.showProjectReports,
                icon: "resources/fugue-icons/icons/drill.png"
            }, {
                text: i18n("System Notices"),
                handler: this.showSystemNotices,
                icon: "resources/fugue-icons/icons/service-bell.png"
            }, {
                text: i18n("Stock History"),
                handler: this.showStockHistory,
                icon: "resources/fugue-icons/icons/notebook.png"
            }]
        });
        this.systemMenu = Ext.create("Ext.menu.Menu", {
            items: [{
                text: i18n("Disconnect"),
                icon: "resources/silkicons/disconnect.png",
                handler: this.disconnect
            }, {
                text: i18n("User Preferences"),
                icon: "resources/fugue-icons/icons/gear.png",
                handler: this.showUserPreferences
            }]
        });
        this.items = [{
            text: i18n("System"),
            menu: this.systemMenu
        }, {
            text: i18n("Edit"),
            menu: this.editMenu
        }, {
            text: i18n("View"),
            menu: this.viewMenu
        }, "->",
        {
            xtype: "tbtext",
            cls: "partkeepr-logo-align",
            text: '<div class="partkeepr-logo">PartKeepr</div>',
            width: 200
        }];
        this.callParent()
    },
    showUserPreferences: function () {
        var a = new PartKeepr.UserPreferencePanel({
            iconCls: "icon-gear",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    disconnect: function () {
        PartKeepr.getApplication().logout()
    },
    showSystemInformation: function () {
        var a = Ext.create("PartKeepr.SystemInformationGrid", {
            title: i18n("System Information"),
            iconCls: "icon-system-monitor",
            closable: true,
            padding: "5 5 5 5"
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    showStatisticsSummary: function () {
        var a = Ext.create("PartKeepr.CurrentStatisticsPanel", {
            iconCls: "icon-chart-bar",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    showStatisticsChart: function () {
        var a = Ext.create("PartKeepr.StatisticsChartPanel", {
            iconCls: "icon-chart-bar",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    editStorageLocations: function () {
        var a = Ext.create("PartKeepr.StorageLocationEditorComponent", {
            title: i18n("Storage Locations"),
            iconCls: "icon-wooden-box",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    editUnits: function () {
        var a = Ext.create("PartKeepr.UnitEditorComponent", {
            title: i18n("Units"),
            iconCls: "icon-unit",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    editManufacturers: function () {
        var a = Ext.create("PartKeepr.ManufacturerEditorComponent", {
            title: i18n("Manufacturers"),
            iconCls: "icon-building",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    editFootprints: function () {
        var a = Ext.create("PartKeepr.FootprintEditorComponent", {
            title: i18n("Footprints"),
            iconCls: "icon-footprint",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    editDistributors: function () {
        var a = Ext.create("PartKeepr.DistributorEditorComponent", {
            title: i18n("Distributors"),
            iconCls: "icon-lorry",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    editUsers: function () {
        var a = Ext.create("PartKeepr.UserEditorComponent", {
            title: i18n("Users"),
            iconCls: "icon-user",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    editPartUnits: function () {
        var a = Ext.create("PartKeepr.PartUnitEditorComponent", {
            title: i18n("Part Measurement Units"),
            iconCls: "icon-ruler",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    editProjects: function () {
        var a = Ext.create("PartKeepr.ProjectEditorComponent", {
            title: i18n("Projects"),
            iconCls: "icon-drill",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    showProjectReports: function () {
        var a = Ext.create("PartKeepr.ProjectReportView", {
            title: i18n("Project Reports"),
            iconCls: "icon-drill",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    showSystemNotices: function () {
        var a = Ext.create("PartKeepr.SystemNoticeEditorComponent", {
            title: i18n("System Notices"),
            iconCls: "icon-service-bell",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    showStockHistory: function () {
        var a = Ext.create("PartKeepr.StockHistoryGrid", {
            title: i18n("Stock History"),
            iconCls: "icon-notebook",
            closable: true
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    },
    displayComponent: function (b) {
        var a = Ext.create(b.type, {
            title: b.title,
            iconCls: b.iconCls,
            closable: b.closable
        });
        PartKeepr.getApplication().addItem(a);
        a.show()
    }
});
Ext.define("PartKeepr.StorageLocationMultiCreateWindow", {
    extend: "Ext.Window",
    layout: "fit",
    width: 500,
    height: 250,
    title: i18n("Multi-Create Storage Locations"),
    initComponent: function () {
        this.form = Ext.create("PartKeepr.StorageLocationMultiAddDialog");
        this.items = [this.form];
        this.addButton = Ext.create("Ext.button.Button", {
            text: i18n("Create Storage Locations"),
            icon: "resources/silkicons/add.png",
            handler: this.onAddClick,
            scope: this
        });
        this.dockedItems = [{
            xtype: "toolbar",
            defaults: {
                minWidth: 100
            },
            dock: "bottom",
            ui: "footer",
            pack: "start",
            items: [this.addButton,
            {
                text: i18n("Close"),
                handler: this.onCloseClick,
                scope: this,
                icon: "resources/silkicons/cancel.png"
            }]
        }];
        this.callParent()
    },
    onAddClick: function () {
        this.addButton.disable();
        var a = new PartKeepr.ServiceCall("StorageLocation", "massCreate");
        a.setParameter("storageLocations", this.form.getStorageLocations());
        a.setHandler(Ext.bind(this.onAdded, this));
        a.doCall()
    },
    onAdded: function (a) {
        this.addButton.enable();
        if (a.data.length > 0) {
            Ext.Msg.alert(i18n("Errors occured"), implode("<br>", a.data))
        } else {
            this.close()
        }
    },
    onCloseClick: function () {
        this.close()
    }
});
Ext.define("PartKeepr.StorageLocationMultiAddDialog", {
    extend: "Ext.form.Panel",
    layout: "anchor",
    defaults: {
        anchor: "100%"
    },
    border: false,
    bodyStyle: "background:#DBDBDB;padding: 10px;",
    initComponent: function () {
        this.storageLocationPrefix = Ext.create("Ext.form.field.Text", {
            fieldLabel: i18n("Name Prefix"),
            listeners: {
                change: {
                    fn: this.onFormChange,
                    scope: this
                }
            }
        });
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
        this.outputField = Ext.create("Ext.form.field.TextArea", {
            fieldLabel: i18n("Sample"),
            readOnly: true,
            anchor: "100% -70"
        });
        this.items = [this.storageLocationPrefix,
        {
            layout: "column",
            border: false,
            bodyStyle: "background:#DBDBDB;",
            items: [this.storageLocationStart, this.storageLocationEnd]
        }, {
            layout: "column",
            border: false,
            plain: true,
            bodyStyle: "background:#DBDBDB;",
            items: [this.storageLocationZeroPrefix, this.storageLocationOverallLength]
        },
        this.outputField];
        this.callParent();
        this.recalculateDemo()
    },
    onFormChange: function () {
        if (this.storageLocationOverallLength.getValue() < this.getMinLength()) {
            this.storageLocationOverallLength.setValue(this.getMinLength())
        }
        if (this.storageLocationStart.getValue() > this.storageLocationEnd.getValue()) {
            this.storageLocationEnd.setValue(this.storageLocationStart.getValue())
        }
        if (this.storageLocationZeroPrefix.getValue()) {
            this.storageLocationOverallLength.enable()
        } else {
            this.storageLocationOverallLength.disable()
        }
        this.recalculateDemo()
    },
    getMinLength: function () {
        return strlen(this.storageLocationPrefix.getValue()) + strlen((this.storageLocationEnd.getValue()).toString())
    },
    recalculateDemo: function () {
        this.outputField.setValue(implode("\n", this.getStorageLocations()))
    },
    getStorageLocations: function () {
        var a = [];
        for (var b = this.storageLocationStart.getValue(); b < this.storageLocationEnd.getValue() + 1; b++) {
            if (!this.storageLocationZeroPrefix.getValue()) {
                a.push(this.storageLocationPrefix.getValue() + b)
            } else {
                var c = this.storageLocationOverallLength.getValue() - (strlen(this.storageLocationPrefix.getValue()) + strlen(b));
                a.push(this.storageLocationPrefix.getValue() + str_repeat("0", c) + b)
            }
        }
        return a
    }
});
Ext.define("PartKeepr.CategoryTree", {
    alias: "widget.CategoryTree",
    extend: "Ext.tree.Panel",
    categoryService: null,
    categoryModel: null,
    displayField: "name",
    sorters: [{
        property: "name",
        direction: "ASC"
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
        this.loadCategories()
    },
    loadCategories: function () {
        var a = new PartKeepr.ServiceCall(this.categoryService, "getAllCategories");
        a.setLoadMessage(i18n("Loading categories..."));
        a.setHandler(Ext.bind(this._onCategoriesLoaded, this));
        a.doCall()
    },
    _onCategoriesLoaded: function (a) {
        var b = this.getExpandedNodes(this.getRootNode());
        this.getRootNode().removeAll();
        this.buildCategoryTree(this.getRootNode(), a, b);
        this.loaded = true;
        this.getRootNode().expandChildren();
        this.getStore().sort("name", "ASC");
        this.fireEvent("categoriesLoaded")
    },
    getExpandedNodes: function (c) {
        var a = [];
        if (c.get("expanded") === true) {
            a.push(c.get("id"))
        }
        for (var b = 0; b < c.childNodes.length; b++) {
            a = a.concat(this.getExpandedNodes(c.childNodes[b]))
        }
        return a
    },
    buildCategoryTree: function (a, f, c) {
        var b = {
            id: f.id,
            name: f.name,
            tooltip: f.description
        };
        if (Ext.Array.contains(c, f.id)) {
            Ext.apply(b, {
                expanded: true
            })
        }
        if (f.id == 1) {
            b.allowDrag = false
        }
        b.leaf = false;
        b.loaded = true;
        var e = a.appendChild(Ext.create(this.categoryModel, b));
        for (var d = 0; d < f.children.length; d++) {
            this.buildCategoryTree(e, f.children[d], c)
        }
    }
});
Ext.define("PartKeepr.CategoryEditorTree", {
    alias: "widget.CategoryEditorTree",
    extend: "PartKeepr.CategoryTree",
    ddGroup: null,
    categoryModel: null,
    categoryService: null,
    initComponent: function () {
        if (this.ddGroup !== null) {
            Ext.apply(this, {
                viewConfig: {
                    animate: false,
                    plugins: {
                        ptype: "treeviewdragdrop",
                        ddGroup: this.ddGroup
                    }
                }
            })
        }
        this.createToolbar();
        this.callParent();
        this.getView().on("drop", Ext.bind(this.onCategoryDrop, this));
        this.getView().on("beforedrop", this.onBeforeDrop, this);
        this.getView().on("itemcontextmenu", Ext.bind(this.onItemContextMenu, this));
        this.createMenu()
    },
    onBeforeDrop: function () {},
    onCategoryDrop: function (d, f, b, h) {
        var e = f.records[0];
        var g = this.getView().getRecord(d);
        if (!e.isCategory) {
            return
        } else {
            var a;
            if (h == "after" || h == "before") {
                a = g.parentNode
            } else {
                a = g
            }
            this.getStore().sort("name", "ASC");
            var c = new PartKeepr.ServiceCall(this.categoryService, "moveCategory");
            c.setLoadMessage(sprintf(i18n("Moving category %s..."), e.get("name")));
            c.setParameter("category", e.get("id"));
            c.setParameter("target", a.get("id"));
            c.doCall()
        }
    },
    onItemContextMenu: function (b, a, e, c, d) {
        if (!a.isCategory) {
            return
        }
        var f = this.menu;
        d.stopEvent();
        f.record = a;
        this.menuCategoryDelete.enable();
        if (a.get("id") == 1) {
            this.menuCategoryDelete.disable()
        }
        if (a.hasChildNodes()) {
            this.menuCategoryDelete.disable()
        }
        f.showAt(d.getXY())
    },
    createMenu: function () {
        this.menuCategoryDelete = Ext.create("Ext.menu.Item", {
            text: i18n("Delete Category"),
            handler: Ext.bind(this.confirmCategoryDelete, this),
            icon: "resources/silkicons/folder_delete.png"
        });
        this.menuCategoryAdd = Ext.create("Ext.menu.Item", {
            text: i18n("Add Category"),
            handler: Ext.bind(this.showCategoryAddDialog, this),
            icon: "resources/silkicons/folder_add.png"
        });
        this.menuCategoryEdit = Ext.create("Ext.menu.Item", {
            text: i18n("Edit Category"),
            handler: Ext.bind(this.showCategoryEditDialog, this),
            icon: "resources/silkicons/folder_edit.png"
        });
        this.menu = Ext.create("widget.menu", {
            items: [this.menuCategoryAdd, this.menuCategoryEdit, this.menuCategoryDelete]
        })
    },
    createToolbar: function () {
        this.toolbarExpandButton = Ext.create("Ext.button.Button", {
            icon: "resources/fugue-icons/icons/toggle-expand.png",
            tooltip: i18n("Expand All"),
            handler: this._onExpandClick,
            scope: this
        });
        this.toolbarCollapseButton = Ext.create("Ext.button.Button", {
            icon: "resources/fugue-icons/icons/toggle.png",
            tooltip: i18n("Collapse All"),
            handler: this._onCollapseClick,
            scope: this
        });
        this.toolbarReloadButton = Ext.create("Ext.button.Button", {
            icon: "extjs/resources/themes/images/default/grid/refresh.gif",
            tooltip: i18n("Reload"),
            handler: this._onReloadClick,
            scope: this
        });
        this.toolbar = Ext.create("Ext.toolbar.Toolbar", {
            enableOverflow: true,
            dock: "top",
            items: [this.toolbarExpandButton, this.toolbarCollapseButton, this.toolbarReloadButton]
        });
        Ext.apply(this, {
            dockedItems: [this.toolbar]
        })
    },
    _onReloadClick: function () {
        this.loadCategories()
    },
    _onExpandClick: function () {
        this.getRootNode().firstChild.expand(true)
    },
    _onCollapseClick: function () {
        this.getRootNode().firstChild.collapse(true)
    },
    confirmCategoryDelete: function () {
        Ext.Msg.confirm(i18n("Confirm Category Delete"), sprintf(i18n("Do you really wish to delete the category %s?"), this.menu.record.get("name")), this.onCategoryDelete, this)
    },
    showCategoryAddDialog: function () {
        var a = Ext.create("PartKeepr.CategoryEditorWindow", {
            record: null,
            categoryModel: this.categoryModel,
            parent: this.menu.record.get("id"),
            listeners: {
                save: Ext.bind(this.onUpdateRecord, this)
            }
        });
        a.show()
    },
    showCategoryEditDialog: function () {
        var a = Ext.create("PartKeepr.CategoryEditorWindow", {
            record: this.menu.record,
            parent: null,
            categoryModel: this.categoryModel,
            listeners: {
                save: Ext.bind(this.onUpdateRecord, this)
            }
        });
        a.show()
    },
    onUpdateRecord: function (b) {
        var a = this.getStore().getRootNode().findChild("id", b.get("id"), true);
        if (a === null) {
            var d = this.getStore().getRootNode().findChild("id", b.get("parent"), true);
            var c = {
                id: b.get("id"),
                name: b.get("name"),
                tooltip: b.get("description")
            };
            d.appendChild(c)
        } else {
            a.set("name", b.get("name"));
            a.set("description", b.get("description"));
            a.commit()
        }
    },
    onCategoryDelete: function (b) {
        if (b == "yes") {
            var a = this.getStore().getRootNode().findChild("id", this.menu.record.get("id"), true);
            a.destroy({
                failure: function () {
                    this.loadCategories()
                },
                scope: this
            })
        }
    }
});
Ext.define("PartKeepr.FootprintTree", {
    extend: "PartKeepr.CategoryEditorTree",
    alias: "widget.FootprintTree",
    ddGroup: "FootprintTree",
    categoryModel: "PartKeepr.FootprintCategory",
    categoryService: "FootprintCategory",
    folderSort: true,
    addButtonIcon: "resources/icons/footprint_add.png",
    deleteButtonIcon: "resources/icons/footprint_delete.png",
    initComponent: function () {
        this.callParent();
        this.addEvents("itemEdit");
        this.on("itemclick", Ext.bind(function (b, a) {
            if (a.get("footprintId")) {
                this.fireEvent("itemEdit", a.get("footprintId"))
            }
        }, this));
        this.addButton = Ext.create("Ext.button.Button", {
            tooltip: i18n("Add Footprint"),
            icon: this.addButtonIcon,
            handler: this._onAddFootprint,
            scope: this
        });
        this.deleteButton = Ext.create("Ext.button.Button", {
            tooltip: i18n("Delete Footprint"),
            icon: this.deleteButtonIcon,
            handler: Ext.bind(function () {
                this.fireEvent("itemDelete")
            }, this),
            disabled: true
        });
        this.toolbar.add(["-", this.addButton, this.deleteButton]);
        this.getSelectionModel().on("select", this._onItemSelect, this);
        this.getSelectionModel().on("deselect", this._onItemDeselect, this)
    },
    _onAddFootprint: function () {
        var a = this.getSelectionModel().getLastSelected();
        if (a && !a.get("footprintId")) {
            this.fireEvent("itemAdd", {
                category: a.get("id")
            })
        } else {
            if (!a) {
                this.fireEvent("itemAdd", this.getRootNode().get("id"))
            } else {
                if (a.parentNode && !a.parentNode.get("footprintId")) {
                    this.fireEvent("itemAdd", {
                        category: a.parentNode.get("id")
                    })
                } else {
                    this.fireEvent("itemAdd", this.getRootNode().get("id"))
                }
            }
        }
    },
    _onItemSelect: function (a, b) {
        this._updateDeleteButton(a, b);
        this.fireEvent("itemSelect", b)
    },
    _onItemDeselect: function (a, b) {
        this._updateDeleteButton(a, b);
        this.fireEvent("itemDeselect", b)
    },
    _updateDeleteButton: function (a, b) {
        if (this.getSelectionModel().getCount() == 1 && b.get("footprintId")) {
            this.deleteButton.enable()
        } else {
            this.deleteButton.disable()
        }
    },
    syncChanges: function (b) {
        var c = PartKeepr.getApplication().getFootprintStore().find("id", b.get("id"));
        if (c === -1) {
            PartKeepr.getApplication().getFootprintStore().add(b)
        } else {
            var a = PartKeepr.getApplication().getFootprintStore().getAt(c);
            a.set("name", b.get("name"))
        }
        this.loadCategories()
    },
    _onCategoriesLoaded: function () {
        this.callParent(arguments);
        var b = PartKeepr.getApplication().getFootprintStore();
        var f;
        var c, a;
        for (var d = 0; d < b.getCount(); d++) {
            a = b.getAt(d);
            c = {
                name: a.getRecordName(),
                footprintId: a.get("id"),
                leaf: true,
                iconCls: "icon-footprint"
            };
            if (a.get("category") === 0) {
                this.getRootNode().firstChild.appendChild(c)
            } else {
                var e = this.getRootNode().findChild("id", a.get("category"), true);
                if (e) {
                    e.appendChild(c)
                } else {
                    this.getRootNode().firstChild.appendChild(c)
                }
            }
        }
    },
    onBeforeDrop: function (a, b, e, g, f, i) {
        var c = b.records[0];
        var d = this.getView().getRecord(a);
        if (d.get("footprintId")) {
            return false
        }
        if (c.get("footprintId")) {
            var h = new PartKeepr.ServiceCall("Footprint", "moveFootprint");
            h.setParameter("id", c.get("footprintId"));
            h.setParameter("targetCategory", d.get("id"));
            h.setHandler(Ext.bind(function () {
                var l = this.getRootNode().findChild("footprintId", c.get("footprintId"), true);
                var m = this.getRootNode().findChild("id", d.get("id"), true);
                m.expand();
                l.remove();
                m.appendChild(l);
                var k = PartKeepr.getApplication().getFootprintStore().find("id", c.get("footprintId"));
                var j = PartKeepr.getApplication().getFootprintStore().getAt(k);
                j.set("category", d.get("id"))
            }, this));
            h.doCall();
            return false
        }
    }
});
Ext.define("PartKeepr.PartCategoryTree", {
    extend: "PartKeepr.CategoryEditorTree",
    alias: "widget.PartCategoryTree",
    ddGroup: "PartTree",
    categoryModel: "PartKeepr.PartCategory",
    categoryService: "PartCategory",
    initComponent: function () {
        this.addEvents("syncCategory");
        this.callParent();
        this.syncButton = Ext.create("Ext.button.Button", {
            tooltip: i18n("Reveal Category for selected part"),
            icon: "resources/fugue-icons/icons/arrow-split-180.png",
            handler: Ext.bind(function () {
                this.fireEvent("syncCategory")
            }, this),
            disabled: true
        });
        this.toolbar.add(["->", this.syncButton])
    },
    onBeforeDrop: function (b, d, g, j, h, l) {
        var e = d.records[0];
        var f = this.getView().getRecord(b);
        if (e.modelName == "PartKeepr.Part") {
            var k = new PartKeepr.ServiceCall("Part", "movePart");
            if (d.records.length > 1) {
                var a = [];
                for (var c = 0; c < d.records.length; c++) {
                    a.push(d.records[c].get("id"))
                }
                k.setParameter("parts", a)
            } else {
                k.setParameter("part", e.get("id"))
            }
            k.setParameter("targetCategory", f.get("id"));
            k.setHandler(function () {
                d.view.store.load()
            });
            k.doCall();
            return false
        }
    }
});
Ext.define("PartKeepr.PartManager", {
    extend: "Ext.panel.Panel",
    alias: "widget.PartManager",
    layout: "border",
    id: "partkeepr-partmanager",
    border: false,
    padding: 5,
    initComponent: function () {
        this.createStore({
            model: "PartKeepr.Part",
            proxy: PartKeepr.getRESTProxy("Part"),
            groupField: "categoryPath",
            sorters: [{
                property: "name",
                direction: "ASC"
            }]
        });
        this.tree = Ext.create("PartKeepr.PartCategoryTree", {
            region: "west",
            categoryModel: "PartKeepr.PartCategory",
            categoryService: "PartCategory",
            split: true,
            title: i18n("Categories"),
            ddGroup: "CategoryTree",
            width: 300,
            collapsible: true
        });
        this.tree.on("selectionchange", Ext.bind(function (a, b) {
            if (b.length > 0) {
                this.grid.setCategory(b[0].get("id"))
            }
        }, this));
        this.detail = Ext.create("PartKeepr.PartDisplay", {
            title: i18n("Part Details")
        });
        this.detail.on("editPart", this.onEditPart, this);
        this.grid = Ext.create("PartKeepr.PartsGrid", {
            title: i18n("Parts List"),
            region: "center",
            layout: "fit",
            store: this.getStore()
        });
        this.grid.on("editPart", this.onEditPart, this);
        this.grid.on("itemSelect", this.onItemSelect, this);
        this.grid.on("itemDeselect", this.onItemSelect, this);
        this.grid.on("itemAdd", this.onItemAdd, this);
        this.grid.on("itemDelete", this.onItemDelete, this);
        this.grid.on("itemCreateFromTemplate", this.onItemCreateFromTemplate, this);
        this.tree.on("syncCategory", this.onSyncCategory, this);
        this.detail.on("partChanged", function () {
            this.grid.getStore().load()
        }, this);
        this.stockLevel = Ext.create("PartKeepr.PartStockHistory", {
            title: "Stock History"
        });
        this.detailPanel = Ext.create("Ext.tab.Panel", {
            title: i18n("Part Details"),
            collapsed: true,
            collapsible: true,
            region: "east",
            split: true,
            width: 300,
            animCollapse: false,
            items: [this.detail, this.stockLevel]
        });
        this.filterPanel = Ext.create("PartKeepr.PartFilterPanel", {
            region: "south",
            title: i18n("Filter"),
            height: 200,
            split: true,
            collapsed: true,
            collapsible: true,
            store: this.store
        });
        this.items = [this.tree,
        {
            layout: "border",
            border: false,
            region: "center",
            items: [this.grid, this.filterPanel]
        },
        this.detailPanel];
        this.callParent()
    },
    onSyncCategory: function () {
        var d = this.grid.getSelectionModel().getLastSelected();
        var b = this.tree.getRootNode();
        var a = d.get("category");
        var c = b.findChild("id", a, true);
        this.tree.getView().ensureVisible(c);
        this.tree.getView().scrollIntoView(c);
        var e = new Ext.Element(this.tree.getView().getNode(c));
        e.highlight("2aaad3")
    },
    onItemDelete: function () {
        var a = this.grid.getSelectionModel().getLastSelected();
        Ext.Msg.confirm(i18n("Delete Part"), sprintf(i18n("Do you really wish to delete the part %s?"), a.get("name")), this.deletePart, this)
    },
    onItemCreateFromTemplate: function () {
        var a = this.grid.getSelectionModel().getLastSelected();
        this.loadPart(a.get("id"), Ext.bind(this.createPartDuplicate, this))
    },
    createPartDuplicate: function (b) {
        var c = b.copy();
        Ext.data.Model.id(c);
        c.set("id", null);
        var a = Ext.create("PartKeepr.PartEditorWindow", {
            partMode: "create"
        });
        a.editor.on("partSaved", this.onPartSaved, this);
        a.editor.editItem(c);
        a.show()
    },
    deletePart: function (a) {
        var c = this.grid.getSelectionModel().getLastSelected();
        if (a == "yes") {
            var b = new PartKeepr.ServiceCall("Part", "deletePart");
            b.setLoadMessage(sprintf(i18n("Deleting part %s"), c.get("name")));
            b.setParameter("part", c.get("id"));
            b.setHandler(Ext.bind(function () {
                this.store.load()
            }, this));
            b.doCall()
        }
    },
    onItemAdd: function () {
        var a = Ext.create("PartKeepr.PartEditorWindow", {
            partMode: "create"
        });
        var c = {};
        var b = PartKeepr.getApplication().getPartUnitStore().findRecord("default", true);
        c.partUnit = b.get("id");
        c.category = this.grid.currentCategory;
        record = Ext.create("PartKeepr.Part", c);
        a.editor.partDefaults = c;
        a.editor.editItem(record);
        a.show();
        return a
    },
    onEditPart: function (a) {
        this.loadPart(a, Ext.bind(this.onPartLoaded, this))
    },
    onPartLoaded: function (c, b) {
        var a = Ext.create("PartKeepr.PartEditorWindow");
        a.editor.on("partSaved", this.onPartSaved, this);
        a.editor.editItem(c);
        a.show()
    },
    onPartSaved: function (b) {
        var a = this.grid.store.find("id", b.get("id"));
        if (a !== -1) {
            this.grid.store.load()
        }
        this.detail.setValues(b)
    },
    onItemSelect: function () {
        if (this.grid.getSelectionModel().getCount() > 1) {
            this.detailPanel.collapse();
            this.tree.syncButton.disable()
        } else {
            if (this.grid.getSelectionModel().getCount() == 1) {
                var a = this.grid.getSelectionModel().getLastSelected();
                this.detailPanel.setActiveTab(this.detail);
                this.detailPanel.expand();
                this.detail.setValues(a);
                this.stockLevel.part = a.get("id");
                this.tree.syncButton.enable()
            } else {
                this.tree.syncButton.disable()
            }
        }
    },
    loadPart: function (c, b) {
        var a = Ext.ModelManager.getModel("PartKeepr.Part");
        a.load(c, {
            scope: this,
            success: b
        })
    },
    createStore: function (a) {
        Ext.Object.merge(a, {
            autoLoad: true,
            autoSync: false,
            remoteFilter: true,
            remoteSort: true,
            pageSize: 50
        });
        this.store = Ext.create("Ext.data.Store", a);
        this.store.on("write", function (c, b) {
            var d = b.wasSuccessful();
            if (d) {
                Ext.each(b.records, function (e) {
                    if (e.dirty) {
                        e.commit()
                    }
                })
            }
        })
    },
    getStore: function () {
        return this.store
    }
});
Ext.define("PartKeepr.PartStockWindow", {
    extend: "Ext.window.Window",
    constrainHeader: true,
    width: 300,
    height: 150,
    resizable: false,
    layout: "fit",
    title: "",
    removePartText: i18n("Remove Part(s)"),
    addPartText: i18n("Add Part(s)"),
    layout: "anchor",
    bodyStyle: {
        padding: "5px"
    },
    initComponent: function () {
        this.quantityField = Ext.create("Ext.form.field.Number", {
            value: 0,
            minValue: 1,
            width: 100,
            listeners: {
                specialkey: {
                    fn: function (b, a) {
                        if (a.getKey() == a.ENTER) {
                            this.onOKClick()
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
            anchor: "100%",
            value: 0,
            fieldLabel: i18n("Price"),
            listeners: {
                specialkey: {
                    fn: function (b, a) {
                        if (a.getKey() == a.ENTER) {
                            this.onOKClick()
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
            bodyStyle: "background:#DBDBDB;",
            border: false,
            items: [{
                xtype: "fieldcontainer",
                fieldLabel: i18n("Quantity"),
                layout: "hbox",
                items: [this.quantityField,
                {
                    width: 75,
                    xtype: "displayfield",
                    margin: "0 0 0 5",
                    value: this.partUnitName
                }]
            },
            this.priceField, this.priceCheckbox]
        });
        this.items = this.form;
        this.buttons = [{
            text: i18n("Close"),
            handler: this.onCloseClick,
            scope: this
        }, {
            text: i18n("OK"),
            handler: this.onOKClick,
            scope: this
        }];
        this.on("show", function () {
            this.quantityField.focus()
        }, this);
        this.callParent()
    },
    onCloseClick: function () {
        this.close()
    },
    onOKClick: function () {
        if (this.form.getForm().isValid()) {
            var a;
            if (this.priceCheckbox.getValue()) {
                a = this.priceField.getValue()
            } else {
                a = this.priceField.getValue() / this.quantityField.getValue()
            }
            Ext.callback(this.callbackFn, this.callbackScope, [this.quantityField.getValue(), a]);
            this.close()
        }
    },
    addStock: function (b, a) {
        this.callbackFn = b;
        this.callbackScope = a;
        this.setTitle(this.addPartText);
        this.show()
    },
    removeStock: function (b, a) {
        this.callbackFn = b;
        this.callbackScope = a;
        this.setTitle(this.removePartText);
        this.priceField.hide();
        this.priceCheckbox.hide();
        this.show()
    }
});
Ext.define("PartKeepr.PartEditorWindow", {
    extend: "Ext.window.Window",
    constrainHeader: true,
    layout: "fit",
    width: 600,
    minWidth: 600,
    minHeight: 390,
    height: 390,
    saveText: i18n("Save"),
    cancelText: i18n("Cancel"),
    partMode: "edit",
    title: i18n("Add Part"),
    initComponent: function () {
        this.editor = Ext.create("PartKeepr.PartEditor", {
            border: false,
            partMode: this.partMode,
            enableButtons: false
        });
        if (this.partMode && this.partMode == "create") {
            this.height = 445
        }
        this.items = [this.editor];
        this.editor.on("editorClose", function (a) {
            this.close()
        }, this, {
            delay: 200
        });
        this.editor.on("titleChange", function (a) {
            this.setTitle(a)
        }, this);
        this.editor.on("itemSaved", this.onItemSaved, this);
        this.saveButton = Ext.create("Ext.button.Button", {
            text: this.saveText,
            icon: "resources/fugue-icons/icons/disk.png",
            handler: Ext.bind(this.onItemSave, this)
        });
        this.cancelButton = Ext.create("Ext.button.Button", {
            text: this.cancelText,
            icon: "resources/silkicons/cancel.png",
            handler: Ext.bind(this.onCancelEdit, this)
        });
        this.bottomToolbar = Ext.create("Ext.toolbar.Toolbar", {
            enableOverflow: true,
            defaults: {
                minWidth: 100
            },
            dock: "bottom",
            ui: "footer",
            pack: "start",
            items: [this.saveButton, this.cancelButton]
        });
        this.dockedItems = [this.bottomToolbar];
        this.keepOpenCheckbox = Ext.create("Ext.form.field.Checkbox", {
            boxLabel: i18n("Create blank item after save")
        });
        if (this.partMode == "create") {
            this.bottomToolbar.add(this.keepOpenCheckbox)
        }
        this.editor.keepOpenCheckbox = this.keepOpenCheckbox;
        this.callParent()
    },
    onCancelEdit: function () {
        this.editor.onCancelEdit()
    },
    onItemSave: function () {
        if (!this.editor.getForm().isValid()) {
            return
        }
        this.saveButton.disable();
        Ext.defer(function () {
            this.saveButton.enable()
        }, 30000, this);
        this.editor._onItemSave()
    },
    onItemSaved: function () {
        this.saveButton.enable()
    }
});
Ext.define("PartKeepr.PartFilterPanel", {
    extend: "Ext.form.Panel",
    alias: "widget.PartFilterPanel",
    bodyPadding: "10px",
    layout: "column",
    bodyStyle: "background:#DBDBDB;",
    initComponent: function () {
        this.createFilterFields();
        this.leftColumn = {
            xtype: "container",
            anchor: "100%",
            layout: "anchor",
            columnWidth: 0.5,
            items: [this.storageLocationFilter, this.categoryFilter, this.partsWithoutPrice]
        };
        this.rightColumn = {
            xtype: "container",
            anchor: "100%",
            columnWidth: 0.5,
            layout: "anchor",
            items: [this.stockFilter, this.distributorOrderNumberFilter]
        };
        this.items = [this.leftColumn, this.rightColumn];
        this.resetButton = Ext.create("Ext.button.Button", {
            text: i18n("Reset"),
            handler: this.onReset,
            icon: "resources/diagona-icons/icons/16/101.png",
            scope: this
        });
        this.applyButton = Ext.create("Ext.button.Button", {
            text: i18n("Apply"),
            icon: "resources/diagona-icons/icons/16/102.png",
            handler: this.onApply,
            scope: this
        });
        this.dockedItems = [{
            xtype: "toolbar",
            enableOverflow: true,
            dock: "bottom",
            defaults: {
                minWidth: 100
            },
            items: [this.applyButton, this.resetButton]
        }];
        this.callParent()
    },
    onApply: function () {
        this.applyFilterParameters(this.store.getProxy().extraParams);
        this.store.currentPage = 1;
        this.store.load({
            start: 0
        })
    },
    onReset: function () {
        this.storageLocationFilter.setValue("");
        this.categoryFilter.setValue({
            category: "all"
        });
        this.stockFilter.setValue({
            stock: "any"
        });
        this.distributorOrderNumberFilter.setValue("");
        this.onApply()
    },
    createFilterFields: function () {
        this.storageLocationFilter = Ext.create("PartKeepr.StorageLocationComboBox", {
            fieldLabel: i18n("Storage Location"),
            forceSelection: true
        });
        this.categoryFilter = Ext.create("Ext.form.RadioGroup", {
            fieldLabel: i18n("Category Scope"),
            columns: 1,
            items: [{
                boxLabel: i18n("All Subcategories"),
                name: "category",
                inputValue: "all",
                checked: true
            }, {
                boxLabel: i18n("Selected Category"),
                name: "category",
                inputValue: "selected"
            }]
        });
        this.stockFilter = Ext.create("Ext.form.RadioGroup", {
            fieldLabel: i18n("Stock Mode"),
            columns: 1,
            items: [{
                boxLabel: i18n("Any Stock Level"),
                name: "stock",
                inputValue: "any",
                checked: true
            }, {
                boxLabel: i18n("Stock Level = 0"),
                name: "stock",
                inputValue: "zero"
            }, {
                boxLabel: i18n("Stock Level > 0"),
                name: "stock",
                inputValue: "nonzero"
            }, {
                boxLabel: i18n("Stock Level < Minimum Stock Level"),
                name: "stock",
                inputValue: "below"
            }]
        });
        this.partsWithoutPrice = Ext.create("Ext.form.field.Checkbox", {
            fieldLabel: i18n("Item Price"),
            boxLabel: i18n("Show Parts without Price only")
        });
        this.distributorOrderNumberFilter = Ext.create("Ext.form.field.Text", {
            fieldLabel: i18n("Order Number")
        })
    },
    applyFilterParameters: function (a) {
        a.withoutPrice = this.partsWithoutPrice.getValue();
        a.categoryScope = this.categoryFilter.getValue().category;
        a.stockMode = this.stockFilter.getValue().stock;
        a.distributorOrderNumber = this.distributorOrderNumberFilter.getValue();
        if (this.storageLocationFilter.getRawValue() !== "") {
            a.storageLocation = this.storageLocationFilter.getRawValue()
        } else {
            delete a.storageLocation
        }
    }
});
Ext.define("PartKeepr.PartDisplay", {
    extend: "Ext.panel.Panel",
    bodyCls: "partdisplay",
    initComponent: function () {
        this.tpl = new Ext.XTemplate("<h1>{name}</h1>", "<table>", "<tr>", '<td class="o">' + i18n("Category") + ":</td>", '<td style="width: 100%;" class="o">{categoryName}</td>', "</tr>", "<tr>", '<td class="e">' + i18n("Stock Level") + ":</td>", '<td class="e">{stockLevel}</td>', "</tr>", "<tr>", '<td class="o">' + i18n("Minimum Stock Level") + ":</td>", '<td class="o">{minStockLevel}</td>', "</tr>", "<tr>", '<td class="e">' + i18n("Footprint") + ":</td>", '<td class="e">{footprintName}</td>', "</tr>", "<tr>", '<td style="white-space: nowrap;" class="o">' + i18n("Storage Location") + ":</td>", '<td class="o">{storageLocationName}</td>', "</tr>", "<tr>", '<td class="e">' + i18n("Comment") + ":</td>", '<td class="e">{comment}</td>', "</tr>", "<tr>", '<td class="o">' + i18n("Create Date") + ":</td>", '<td class="o">{createDate}</td>', "</tr>", "<tr>", '<td class="e">' + i18n("Status") + ":</td>", '<td class="e">{status}</td>', "</tr>", "<tr>", '<td class="o">' + i18n("Needs Review") + ":</td>", '<td class="o">{needsReview}</td>', "</tr>", "</table>");
        this.addButton = new Ext.Button({
            text: i18n("Add Stock"),
            icon: "resources/silkicons/brick_add.png",
            handler: Ext.bind(this.addPartPrompt, this)
        });
        this.deleteButton = new Ext.Button({
            text: i18n("Remove Stock"),
            icon: "resources/silkicons/brick_delete.png",
            handler: Ext.bind(this.deletePartPrompt, this)
        });
        this.editButton = new Ext.Button({
            text: i18n("Edit Part"),
            icon: "resources/silkicons/brick_edit.png",
            handler: Ext.bind(function () {
                this.fireEvent("editPart", this.record.get("id"))
            }, this)
        });
        this.tbar = Ext.create("Ext.toolbar.Toolbar", {
            enableOverflow: true,
            items: [this.addButton, this.deleteButton, this.editButton]
        });
        this.addEvents("editPart");
        this.callParent()
    },
    setValues: function (c) {
        this.record = c;
        var a = {};
        for (var b in c.data) {
            if (c.data[b] !== null) {
                a[b] = htmlentities(c.data[b])
            } else {
                a[b] = c.data[b]
            }
        }
        this.tpl.overwrite(this.getTargetEl(), a)
    },
    addPartPrompt: function () {
        var a = new PartKeepr.PartStockWindow({
            partUnitName: this.record.get("partUnitName")
        });
        a.addStock(this.addPartHandler, this)
    },
    addPartHandler: function (c, b) {
        var a = new PartKeepr.ServiceCall("Part", "addStock");
        a.setParameter("stock", c);
        a.setParameter("price", b);
        a.setParameter("part", this.record.get("id"));
        a.setHandler(Ext.bind(this.reloadPart, this));
        a.doCall()
    },
    deletePartPrompt: function () {
        var a = new PartKeepr.PartStockWindow({
            partUnitName: this.record.get("partUnitName")
        });
        a.removeStock(this.deletePartHandler, this)
    },
    deletePartHandler: function (b) {
        var a = new PartKeepr.ServiceCall("Part", "deleteStock");
        a.setParameter("stock", b);
        a.setParameter("part", this.record.get("id"));
        a.setHandler(Ext.bind(this.reloadPart, this));
        a.doCall()
    },
    reloadPart: function () {
        this.loadPart(this.record.get("id"))
    },
    loadPart: function (a) {
        PartKeepr.Part.load(a, {
            scope: this,
            success: this.onPartLoaded
        })
    },
    onPartLoaded: function (a) {
        this.record = a;
        this.setValues(this.record);
        this.record.commit()
    }
});
window.webcam = {
    version: "1.0.9",
    ie: !! navigator.userAgent.match(/MSIE/),
    protocol: location.protocol.match(/https/i) ? "https" : "http",
    callback: null,
    swf_url: "webcam.swf",
    shutter_url: "shutter.mp3",
    api_url: "",
    loaded: false,
    quality: 90,
    shutter_sound: true,
    stealth: false,
    hooks: {
        onLoad: null,
        onComplete: null,
        onError: null
    },
    set_hook: function (a, b) {
        if (typeof (this.hooks[a]) == "undefined") {
            alert("Hook type not supported: " + a)
        } else {
            this.hooks[a] = b
        }
    },
    fire_hook: function (a, b) {
        if (this.hooks[a]) {
            if (typeof (this.hooks[a]) == "function") {
                this.hooks[a](b)
            } else {
                if (typeof (this.hooks[a]) == "array") {
                    this.hooks[a][0][this.hooks[a][1]](b)
                } else {
                    if (window[this.hooks[a]]) {
                        window[this.hooks[a]](b)
                    }
                }
            }
            return true
        }
        return false
    },
    set_api_url: function (a) {
        this.api_url = a
    },
    set_swf_url: function (a) {
        this.swf_url = a
    },
    get_html: function (d, a, f, e) {
        if (!f) {
            f = d
        }
        if (!e) {
            e = a
        }
        var c = "";
        var b = "shutter_enabled=" + (this.shutter_sound ? 1 : 0) + "&shutter_url=" + escape(this.shutter_url) + "&width=" + d + "&height=" + a + "&server_width=" + f + "&server_height=" + e;
        if (this.ie) {
            c += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="' + this.protocol + '://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="' + d + '" height="' + a + '" id="webcam_movie" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="' + this.swf_url + '" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="' + b + '"/></object>'
        } else {
            c += '<embed id="webcam_movie" src="' + this.swf_url + '" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="' + d + '" height="' + a + '" name="webcam_movie" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="' + b + '" />'
        }
        this.loaded = false;
        return c
    },
    get_movie: function () {
        if (!this.loaded) {
            return alert("ERROR: Movie is not loaded yet")
        }
        var a = document.getElementById("webcam_movie");
        if (!a) {
            alert("ERROR: Cannot locate movie 'webcam_movie' in DOM")
        }
        return a
    },
    set_stealth: function (a) {
        this.stealth = a
    },
    snap: function (b, c, a) {
        if (c) {
            this.set_hook("onComplete", c)
        }
        if (b) {
            this.set_api_url(b)
        }
        if (typeof (a) != "undefined") {
            this.set_stealth(a)
        }
        this.get_movie()._snap(this.api_url, this.quality, this.shutter_sound ? 1 : 0, this.stealth ? 1 : 0)
    },
    freeze: function () {
        this.get_movie()._snap("", this.quality, this.shutter_sound ? 1 : 0, 0)
    },
    upload: function (a, b) {
        if (b) {
            this.set_hook("onComplete", b)
        }
        if (a) {
            this.set_api_url(a)
        }
        this.get_movie()._upload(this.api_url)
    },
    reset: function () {
        this.get_movie()._reset()
    },
    configure: function (a) {
        if (!a) {
            a = "camera"
        }
        this.get_movie()._configure(a)
    },
    set_quality: function (a) {
        this.quality = a
    },
    set_shutter_sound: function (b, a) {
        this.shutter_sound = b;
        this.shutter_url = a ? a : "shutter.mp3"
    },
    flash_notify: function (a, b) {
        switch (a) {
        case "flashLoadComplete":
            this.loaded = true;
            this.fire_hook("onLoad");
            break;
        case "error":
            if (!this.fire_hook("onError", b)) {
                alert("JPEGCam Flash Error: " + b)
            }
            break;
        case "success":
            this.fire_hook("onComplete", b.toString());
            break;
        default:
            alert("jpegcam flash_notify: " + a + ": " + b);
            break
        }
    }
};
Ext.define("Ext.ux.statusbar.StatusBar", {
    extend: "Ext.toolbar.Toolbar",
    alternateClassName: "Ext.ux.StatusBar",
    alias: "widget.statusbar",
    requires: ["Ext.toolbar.TextItem"],
    cls: "x-statusbar",
    busyIconCls: "x-status-busy",
    busyText: "Loading...",
    autoClear: 5000,
    emptyText: "&nbsp;",
    activeThreadId: 0,
    initComponent: function () {
        if (this.statusAlign === "right") {
            this.cls += " x-status-right"
        }
        this.callParent(arguments)
    },
    afterRender: function () {
        this.callParent(arguments);
        var a = this.statusAlign === "right";
        this.currIconCls = this.iconCls || this.defaultIconCls;
        this.statusEl = Ext.create("Ext.toolbar.TextItem", {
            cls: "x-status-text " + (this.currIconCls || ""),
            text: this.text || this.defaultText || ""
        });
        if (a) {
            this.add("->");
            this.add(this.statusEl)
        } else {
            this.insert(0, this.statusEl);
            this.insert(1, "->")
        }
        this.height = 27;
        this.doLayout()
    },
    setStatus: function (d) {
        d = d || {};
        if (Ext.isString(d)) {
            d = {
                text: d
            }
        }
        if (d.text !== undefined) {
            this.setText(d.text)
        }
        if (d.iconCls !== undefined) {
            this.setIcon(d.iconCls)
        }
        if (d.clear) {
            var e = d.clear,
                b = this.autoClear,
                a = {
                    useDefaults: true,
                    anim: true
                };
            if (Ext.isObject(e)) {
                e = Ext.applyIf(e, a);
                if (e.wait) {
                    b = e.wait
                }
            } else {
                if (Ext.isNumber(e)) {
                    b = e;
                    e = a
                } else {
                    if (Ext.isBoolean(e)) {
                        e = a
                    }
                }
            }
            e.threadId = this.activeThreadId;
            Ext.defer(this.clearStatus, b, this, [e])
        }
        this.doLayout();
        return this
    },
    clearStatus: function (c) {
        c = c || {};
        if (c.threadId && c.threadId !== this.activeThreadId) {
            return this
        }
        var b = c.useDefaults ? this.defaultText : this.emptyText,
            a = c.useDefaults ? (this.defaultIconCls ? this.defaultIconCls : "") : "";
        if (c.anim) {
            this.statusEl.el.puff({
                remove: false,
                useDisplay: true,
                scope: this,
                callback: function () {
                    this.setStatus({
                        text: b,
                        iconCls: a
                    });
                    this.statusEl.el.show()
                }
            })
        } else {
            this.statusEl.hide();
            this.setStatus({
                text: b,
                iconCls: a
            });
            this.statusEl.show()
        }
        this.doLayout();
        return this
    },
    setText: function (a) {
        this.activeThreadId++;
        this.text = a || "";
        if (this.rendered) {
            this.statusEl.setText(this.text)
        }
        return this
    },
    getText: function () {
        return this.text
    },
    setIcon: function (a) {
        this.activeThreadId++;
        a = a || "";
        if (this.rendered) {
            if (this.currIconCls) {
                this.statusEl.removeCls(this.currIconCls);
                this.currIconCls = null
            }
            if (a.length > 0) {
                this.statusEl.addCls(a);
                this.currIconCls = a
            }
        } else {
            this.currIconCls = a
        }
        return this
    },
    showBusy: function (a) {
        if (Ext.isString(a)) {
            a = {
                text: a
            }
        }
        a = Ext.applyIf(a || {}, {
            text: this.busyText,
            iconCls: this.busyIconCls
        });
        return this.setStatus(a)
    }
});
Ext.define("PartKeepr.Statusbar", {
    extend: "Ext.ux.statusbar.StatusBar",
    defaultText: i18n("Ready."),
    defaultIconCls: "x-status-valid",
    iconCls: "x-status-valid",
    autoClear: 3000,
    initComponent: function () {
        this.connectionButton = new PartKeepr.ConnectionButton();
        this.connectionButton.on("click", this.onConnectionButtonClick, this);
        this.timeDisplay = new PartKeepr.TimeDisplay();
        this.currentUserDisplay = Ext.create("Ext.toolbar.TextItem");
        this.currentUserDisplay.setText(i18n("Not logged in"));
        this.showMessageLog = Ext.create("Ext.Button", {
            icon: "frontend/administrator/resources/silkicons/application_osx_terminal.png",
            cls: "x-btn-icon",
            handler: function () {
                PartKeepr.getApplication().toggleMessageLog()
            }
        });
        this.systemNoticeButton = Ext.create("PartKeepr.SystemNoticeButton", {
            hidden: true
        });
        Ext.apply(this, {
            items: [this.currentUserDisplay,
            {
                xtype: "tbseparator"
            },
            this.timeDisplay,
            {
                xtype: "tbseparator"
            },
            this.showMessageLog,
            {
                xtype: "tbseparator"
            },
            this.connectionButton, this.systemNoticeButton]
        });
        this.callParent()
    },
    getConnectionButton: function () {
        return this.connectionButton
    },
    setCurrentUser: function (a) {
        this.currentUserDisplay.setText(i18n("Logged in as") + ": " + a)
    },
    startLoad: function (a) {
        if (a !== null) {
            this.showBusy({
                text: a,
                iconCls: "x-status-busy"
            })
        } else {
            this.showBusy()
        }
    },
    endLoad: function () {
        this.clearStatus({
            useDefaults: true
        })
    },
    onConnectionButtonClick: function () {
        if (PartKeepr.getApplication().getSession()) {
            PartKeepr.getApplication().logout()
        } else {
            var a = new PartKeepr.LoginDialog();
            a.show()
        }
    }
});
Ext.define("Ext.tab.TabCloseMenu", {
    alias: "plugin.tabclosemenu",
    alternateClassName: "Ext.ux.TabCloseMenu",
    mixins: {
        observable: "Ext.util.Observable"
    },
    closeTabText: "Close Tab",
    showCloseOthers: true,
    closeOthersTabsText: "Close Other Tabs",
    showCloseAll: true,
    closeAllTabsText: "Close All Tabs",
    extraItemsHead: null,
    extraItemsTail: null,
    constructor: function (a) {
        this.addEvents("aftermenu", "beforemenu");
        this.mixins.observable.constructor.call(this, a)
    },
    init: function (a) {
        this.tabPanel = a;
        this.tabBar = a.down("tabbar");
        this.mon(this.tabPanel, {
            scope: this,
            afterlayout: this.onAfterLayout,
            single: true
        })
    },
    onAfterLayout: function () {
        this.mon(this.tabBar.el, {
            scope: this,
            contextmenu: this.onContextMenu,
            delegate: "div.x-tab"
        })
    },
    onBeforeDestroy: function () {
        Ext.destroy(this.menu);
        this.callParent(arguments)
    },
    onContextMenu: function (d, f) {
        var c = this,
            g = c.createMenu(),
            e = true,
            h = true,
            b = c.tabBar.getChildByElement(f),
            a = c.tabBar.items.indexOf(b);
        c.item = c.tabPanel.getComponent(a);
        g.child('*[text="' + c.closeTabText + '"]').setDisabled(!c.item.closable);
        if (c.showCloseAll || c.showCloseOthers) {
            c.tabPanel.items.each(function (i) {
                if (i.closable) {
                    e = false;
                    if (i != c.item) {
                        h = false;
                        return false
                    }
                }
                return true
            });
            if (c.showCloseAll) {
                g.child('*[text="' + c.closeAllTabsText + '"]').setDisabled(e)
            }
            if (c.showCloseOthers) {
                g.child('*[text="' + c.closeOthersTabsText + '"]').setDisabled(h)
            }
        }
        d.preventDefault();
        c.fireEvent("beforemenu", g, c.item, c);
        g.showAt(d.getXY())
    },
    createMenu: function () {
        var b = this;
        if (!b.menu) {
            var a = [{
                text: b.closeTabText,
                scope: b,
                handler: b.onClose
            }];
            if (b.showCloseAll || b.showCloseOthers) {
                a.push("-")
            }
            if (b.showCloseOthers) {
                a.push({
                    text: b.closeOthersTabsText,
                    scope: b,
                    handler: b.onCloseOthers
                })
            }
            if (b.showCloseAll) {
                a.push({
                    text: b.closeAllTabsText,
                    scope: b,
                    handler: b.onCloseAll
                })
            }
            if (b.extraItemsHead) {
                a = b.extraItemsHead.concat(a)
            }
            if (b.extraItemsTail) {
                a = a.concat(b.extraItemsTail)
            }
            b.menu = Ext.create("Ext.menu.Menu", {
                items: a,
                listeners: {
                    hide: b.onHideMenu,
                    scope: b
                }
            })
        }
        return b.menu
    },
    onHideMenu: function () {
        var a = this;
        a.item = null;
        a.fireEvent("aftermenu", a.menu, a)
    },
    onClose: function () {
        this.tabPanel.remove(this.item)
    },
    onCloseOthers: function () {
        this.doClose(true)
    },
    onCloseAll: function () {
        this.doClose(false)
    },
    doClose: function (b) {
        var a = [];
        this.tabPanel.items.each(function (c) {
            if (c.closable) {
                if (!b || c != this.item) {
                    a.push(c)
                }
            }
        }, this);
        Ext.each(a, function (c) {
            this.tabPanel.remove(c)
        }, this)
    }
});