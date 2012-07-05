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