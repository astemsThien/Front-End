import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import {CommonUtilService} from 'src/app/shared/services/common-util.service';
import {CommonCodeService} from 'src/app/shared/services/common-code.service';
import {BizCodeService} from 'src/app/shared/services/biz-code.service';
import {DxFormComponent} from 'devextreme-angular/ui/form';
import {DxDataGridComponent, DxDateBoxComponent} from 'devextreme-angular';
import {GridUtilService} from 'src/app/shared/services/grid-util.service';
import {Sabu090Service, Sabu090VO} from './sabu090.service';

@Component({
  selector: 'app-sabu090',
  templateUrl: './sabu090.component.html',
  styleUrls: ['./sabu090.component.scss']
})
export class Sabu090Component implements OnInit, AfterViewInit {

  constructor(public utilService: CommonUtilService,
              private service: Sabu090Service,
              private codeService: CommonCodeService,
              private bizService: BizCodeService,
              public gridUtil: GridUtilService) {
    this.G_TENANT = this.utilService.getTenant();
    this.sessionUserId = this.utilService.getUserUid();
    this.userGroup = this.utilService.getUserGroup();
    this.userCompany = this.utilService.getCompany();
    this.onValueChangedPurCd = this.onValueChangedPurCd.bind(this);
    this.calculateCustomSummary = this.calculateCustomSummary.bind(this);
  }

  @ViewChild('mainForm', {static: false}) mainForm: DxFormComponent;
  @ViewChild('mainGrid', {static: false}) mainGrid: DxDataGridComponent;

  @ViewChild('fromInpDate', {static: false}) fromInpDate: DxDateBoxComponent;
  @ViewChild('toInpDate', {static: false}) toInpDate: DxDateBoxComponent;

  dsCustCd = []; // 거래처
  dsMonyUnit = []; // 화폐
  dsItemCd = []; // 품목
  dsUser = []; // 사용자
  dsWhCd = []; // 창고
  filteredWhCd = [];
  dsCopyWhCd = [];

  // Global
  G_TENANT: any;
  sessionUserId: any;
  userGroup: any;
  userCompany: any;

  mainFormData: Sabu090VO = {} as Sabu090VO;

  // main grid
  dataSource: DataSource;
  entityStore: ArrayStore;

  key = ['inp_no', 'item_cd'];
  searchList = [];

  /**
   *  초기화 메소드 START
   */
  ngOnInit(): void {
    // 거래처
    this.bizService.getCust(this.G_TENANT, '', '', '', 'Y', 'Y', '').subscribe(result => {
      this.dsCustCd = result.data;
    });

    // 화폐
    this.codeService.getCode(this.G_TENANT, 'MONYUNIT').subscribe(result => {
      this.dsMonyUnit = result.data;
    });

    // 품목(원부자재)
    this.bizService.getItem(this.G_TENANT, '', 'Y', '2', '', '').subscribe(result => {
      this.dsItemCd = result.data;
    });

    // 사용자
    this.codeService.getUser(this.G_TENANT).subscribe(result => {
      this.dsUser = result.data;
    });

    // 창고
    this.bizService.getWh(this.G_TENANT).subscribe(result => {
      this.dsWhCd = result.data;
    });

    // 영업창고
    this.bizService.getSaWhList(this.G_TENANT).subscribe(result => {
      this.dsCopyWhCd = result.data;
    });
  }

  ngAfterViewInit(): void {
    this.initForm();

    this.utilService.getGridHeight(this.mainGrid);
  }

  // search Form 초기화
  initForm(): void {
    // 공통 조회 조건 set
    const rangeDate = this.utilService.getDateRange();

    this.fromInpDate.value = rangeDate.fromDate;
    this.toInpDate.value = rangeDate.toDate;
  }

  /**
   *  초기화 메소드 END
   */

  /**
   *  조회 메소드 START
   */
  // 메인 그리드 조회
  async onSearch(): Promise<void> {

    const data = this.mainForm.instance.validate();
    if (data.isValid) {
      this.mainFormData.fromInpDate = document.getElementsByName('fromInpDate').item(1).getAttribute('value');
      this.mainFormData.toInpDate = document.getElementsByName('toInpDate').item(1).getAttribute('value');

      const result = await this.service.mainList(this.mainFormData);
      this.searchList = result.data;
      if (!result.success) {
        this.utilService.notify_error(result.msg);
        return;
      } else {
        this.mainGrid.instance.cancelEditData();
        this.utilService.notify_success('search success');
        this.entityStore = new ArrayStore(
          {
            data: result.data,
            key: this.key,
          }
        );
        this.dataSource = new DataSource({
          store: this.entityStore
        });
        this.mainGrid.focusedRowKey = null;
        this.mainGrid.paging.pageIndex = 0;

        const keys = this.mainGrid.instance.getSelectedRowKeys();
        this.mainGrid.instance.deselectRows(keys);
      }
    }
  }

  /**
   *  조회 메소드 END
   */

  /**
   *  이벤트 메소드 START
   */
  async onReset(): Promise<void> {
    await this.mainForm.instance.resetValues();
    await this.initForm();
  }

  /**
   *  이벤트 메소드 END
   */

  onValueChangedPurCd(e): void {
    this.filteredWhCd = this.dsCopyWhCd.filter(el => el.ptrn_cd === this.mainForm.instance.getEditor('purCd').option('value'));
  }

  onOptionChanged(e): void {
    this.gridUtil.onOptionChangedForSummary(e, this); // 합계 계산
  }

  calculateCustomSummary(options): void {
    this.gridUtil.setCustomSummary(options, this.mainGrid, this);
  }


}
