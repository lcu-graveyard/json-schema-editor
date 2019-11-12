import { JSONFlattenUnflatten } from './../../utils/json/json-flatten-unflatten.util';
import { async } from '@angular/core/testing';
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, AbstractControl, FormControl } from '@angular/forms';
import { JSONSchema, IsDataTypeUtil } from '@lcu/common';
import { JSONControlModel } from './../../models/json-control.model';
import { JSONSchemaPropModel } from '../../models/json-schema-prop.model';

@Component({
  selector: 'lcu-json-editor',
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.scss']
})
export class JsonEditorComponent implements OnInit {

  private _jsonSchema: JSONSchema;
  /**
   * JSON Schema input hook
   */
  // tslint:disable-next-line:no-input-rename
  @Input('json-schema')
  public set JSONSchema(val: JSONSchema) {

    if (!val) {
      return;
    }

    this._jsonSchema = val;

    this.updateSchemaControl(val);
    this.iterateJSONSchema(val.default);
  }

  public get JSONSchema(): JSONSchema {
    return this._jsonSchema;
  }

  /**
   * Access address field
   */
  public get EditedSchemaControl(): AbstractControl {
    if (this.JSONSchemaEditorForm) {
      return this.JSONSchemaEditorForm.get('editedSchemaControl');
    }
  }

  /**
   * Array for storing dynamic controls
   */
public get JSONFields(): any {
  // https://www.youtube.com/watch?v=KGxWR7AxDDk
  return this.JSONSchemaEditorForm.get('JSONFields') as FormArray;
}

/**
 * Array to store dynamic control values
 */
public DynamicControlItems: Array<JSONControlModel>;

/**
 * Form control
 */
public JSONSchemaEditorForm: FormGroup;

protected objectCount: number = 0;

protected topLevelProps: Array<JSONSchemaPropModel>;

protected query: string;

constructor(protected formBuilder: FormBuilder) {
  this.DynamicControlItems = [];
  this.topLevelProps = [];
}

ngOnInit() {
  this.setupForm();
}

// Helper functions

/**
 * Setup the form
 */
 protected setupForm(): void {
  this.JSONSchemaEditorForm = this.formBuilder.group({
    editedSchemaControl: new FormControl(''),
    JSONFields: this.formBuilder.array([]) // create array to store dynamic controls
  });
 }

 /**
  * Subscribe to value changes from form controls
  *
  * Subscribing to the FormGroup notifies us of what
  * control actually changed and not the whole form
  */
 protected onChanges(fg: FormGroup): void {
    fg.valueChanges.subscribe((val: JSONControlModel) => {

      const json: JSONSchema = { ...this.JSONSchema };
      json.default[val.ControlName] = val.Value;

      console.log(this.getNestedObject(json.default, ['definitions']));

      const key = Object.keys(json.default)[Object.values(json.default).indexOf(val.Value)];
      json.default = this.renameJSONKey( json.default, key, val.Key );
      this.updateSchemaControl(json);
    });
 }

 /**
  * Renaming JSON properties keys
  *
  * @param json JSON to search through
  *
  * @param oldKey Old property key to search on
  *
  * @param newKey New key that replaces the old one
  *
  */
 protected renameJSONKey(json, oldKey: string, newKey: string): any {
  return Object.keys(json).reduce((s, item) =>
    item === oldKey ? ({ ...s, [newKey]: json[oldKey] }) : ({...s, [item]: json[item]}), {} );
 }

 /**
  * Add new controls
  *
  * @param item control to add
  */
 protected addNewControl(newItem: JSONControlModel) {
    this.DynamicControlItems.push(newItem);

    const fg: FormGroup = this.formBuilder.group(
      {
        Key: [newItem.Key],
        Value: [newItem.Value],
        ControlName: [newItem.Key],
        Indent: [newItem.Indent]
      }
    );

    this.JSONFields.push(fg);

    this.onChanges(fg);
 }

 protected updateSchemaControl(json: JSONSchema): void {
    this.EditedSchemaControl.setValue(JSON.stringify(json.default, null, 100)); // keeps JSON format
 }

 /**
  * Iterate over the JSON Schema and pull out the values we need
  *
  * @param schema JSON Schema
  */
 protected iterateJSONSchema(schema: JSONSchema, indent?: number): void {

  //  console.log('t', JSONFlattenUnflatten.Flatten(schema));
  //  console.log('unflattenMap', JSONFlattenUnflatten.Unflatten(t));

   Object.entries(schema).forEach(([key, value]) => {

      this.addNewControl(new JSONControlModel(key, value, key, indent));

      if (typeof value === 'object') {
          this.objectCount += 10;
          console.log(this.objectCount);
        //  this.iterateJSONSchema(value, this.objectCount);
         // console.log(JSON.stringify(value, null, 5));
        }
       // this.getChildren(this.topLevelProps);
        // console.log('key: ' + key + ', value: ' + value);
      }
    );
    // console.log('top level props', this.topLevelProps);
  }

  /**
   * Drill down to find nested objects
   *
   * @param nestedObj object to test
   * @param pathArr array of names used to drill into objects(a.b.c, etc.)
   */
  protected getNestedObject(nestedObj, pathArr: Array<string>): any {
    return pathArr.reduce((obj, key) =>
        (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
  }

  public Save(): void {

  }

  public ControlSelected(itm: JSONControlModel, idx: number): void {
    console.log('control selected', itm);
    // this.query = '$schema';
    // this.highlight();
    // this.JSONSchema.default[itm.Key] = itm.Key;
    // this.JSONSchema.default[itm.Value] = itm.Value;
    // this.updateSchemaControl();
  }

  // public highlight() {
  //   if (!this.query) {
  //       return this.JSONSchema.default;
  //   }

  //   return this.JSONSchema.default.$schema.replace(new RegExp(this.query, 'gi'), match => {
  //       return '<span class='highlightText'>' + match + '</span>';
  //   });
  // }

}
