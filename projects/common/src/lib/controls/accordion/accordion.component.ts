import { element } from 'protractor';
import { Component, OnInit, Input } from '@angular/core';
import { JSONSchema, IsDataTypeUtil } from '@lcu/common';
import { FormGroup, AbstractControl, FormArray, FormControl, FormBuilder } from '@angular/forms';
import { JSONControlModel } from '../../models/json-control.model';
import { JSONFlattenUnflatten } from '../../utils/json/json-flatten-unflatten.util';

@Component({
  selector: 'lcu-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss']
})
export class AccordionComponent implements OnInit {

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

public TestItems: Array<JSONControlModel>;

/**
 * Form control
 */
public JSONSchemaEditorForm: FormGroup;

/**
 * Property to hold open/close state of panel
 */
public PanelOpenState: boolean;

public InnerTextTest: string;

  constructor(protected formBuilder: FormBuilder) {

    this.PanelOpenState = false;
    this.DynamicControlItems = [];
    this.TestItems = [];
  }

  ngOnInit() {
    this.setupForm();
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

  protected updateSchemaControl(json: JSONSchema): void {
    this.EditedSchemaControl.setValue(JSON.stringify(json.default, null, 5)); // keeps JSON format
 }

 protected indent(item): number {
  return item;
 }

  protected iterateJSONSchema(schema): void {
    const flatMap: Map<string, string> = JSONFlattenUnflatten.FlattenMapTest(schema);
    const flatMapArray: Array<any> = [];

    for (const kv of flatMap) {
      flatMapArray.push(kv);
      flatMapArray.push();
    }

    flatMapArray.forEach((itm: Array<any>, index: number) => {
      let xOffset: number = 0; // want to offset each object item a bit, but can't get it working yet
      const dotNotatedPath: string = itm[0];
      const pathArray: Array<string> = itm[0].split('.');
      const pathLength: number = pathArray.length;
      const value: string = this.getNestedObject(schema, pathArray);

      this.TestItems.push(new JSONControlModel(
        dotNotatedPath,
        this.getNestedObject(schema, pathArray),
        dotNotatedPath,
        10 * xOffset,
        (IsDataTypeUtil.GetDataType(value))));

      this.addNewControl(new JSONControlModel(
        dotNotatedPath,
        this.getNestedObject(schema, pathArray),
        dotNotatedPath,
        10 * xOffset,
        (IsDataTypeUtil.GetDataType(value))));

    });
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
}
