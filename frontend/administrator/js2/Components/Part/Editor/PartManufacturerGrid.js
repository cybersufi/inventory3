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