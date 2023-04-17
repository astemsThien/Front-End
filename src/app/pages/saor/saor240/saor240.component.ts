import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DxDataGridComponent, DxDateBoxComponent, DxFormComponent} from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { BizCodeService } from 'src/app/shared/services/biz-code.service';
import { CommonCodeService } from 'src/app/shared/services/common-code.service';
import { CommonUtilService } from 'src/app/shared/services/common-util.service';
import { GridUtilService } from 'src/app/shared/services/grid-util.service';
import { Saor240Service, Saor240VO } from './saor240.service';

@Component({
  selector: 'app-saor240',
  templateUrl: './saor240.component.html',
  styleUrls: ['./saor240.component.scss']
})
export class Saor240Component implements OnInit, AfterViewInit {

  constructor(public utilService: CommonUtilService,
              private service: Saor240Service,
              private codeService: CommonCodeService,
              private bizService: BizCodeService,
              public gridUtil: GridUtilService) {
    this.G_TENANT = this.utilService.getTenant();
    this.sessionUserId = this.utilService.getUserUid();
    this.userGroup = this.utilService.getUserGroup();
    this.userCompany = this.utilService.getCompany();
    this.ordGbNm = this.ordGbNm.bind(this);
    this.calculateCustomSummary = this.calculateCustomSummary.bind(this);
  }

  @ViewChild('mainForm', {static: false}) mainForm: DxFormComponent;
  @ViewChild('mainGrid', {static: false}) mainGrid: DxDataGridComponent;

  @ViewChild('fromOrdDate', {static: false}) fromOrdDate: DxDateBoxComponent;
  @ViewChild('toOrdDate', {static: false}) toOrdDate: DxDateBoxComponent;

  dsOrdGb     = []; // 주문구분
  dsExptCd    = []; // 수출사
  dsPtrnCd    = []; // 파트너사
  dsMonyUnit  = []; // 화폐
  dsUser      = []; // 사용자
  dsImptCd    = []; // 수입사
  dsWrkStat   = []; // 작업상태
  dsWhCd      = []; // 창고
  dsPort      = []; // 항구

  dsExptCdAll = []; // 전체수출사
  dsPtrnCdAll = []; // 전체파트너사
  dsImptCdAll = []; // 전체수입사

  // Global
  G_TENANT: any;
  sessionUserId: any;
  userGroup: any;
  userCompany: any;

  mainFormData: Saor240VO = {} as Saor240VO;

  // main grid
  dataSource: DataSource;
  entityStore: ArrayStore;

  key = ['out_ord_no'];
  searchList = [];

  /**
   *  초기화 메소드 START
   */
  ngOnInit(): void {
    // 주문구분
    this.dsOrdGb = [{cd: '4', nm: this.utilService.convert('sales.sale_return')},
      {cd: '5', nm: this.utilService.convert('sales.rent_return')},
      {cd: '6', nm: this.utilService.convert('sales.sample_return')}];

    // 작업상태
    this.dsWrkStat = [// {cd:"1", nm:this.utilService.convert1('sales.ord_assign', '주문할당', 'Assign Order')},
                      {cd: '2', nm:this.utilService.convert1('sales.out_ord', '출고지시', 'Out Order')},
                      {cd: '3', nm:this.utilService.convert1('sales.out', '출고', 'Out')}];


    // 수출사
    this.bizService.getCust(this.G_TENANT, '', 'Y', '', 'Y', '', '').subscribe(result => { this.dsExptCd = result.data; });

    // 파트너사
    this.bizService.getCust(this.G_TENANT, 'Y', '', '', 'Y', '', '').subscribe(result => { this.dsPtrnCd = result.data; });

    // 화폐
    this.codeService.getCode(this.G_TENANT, 'MONYUNIT').subscribe(result => { this.dsMonyUnit = result.data; });

    // 사용자
    this.codeService.getUser(this.G_TENANT).subscribe(result => { this.dsUser = result.data; });

    // 수입사
    this.bizService.getCust(this.G_TENANT, '', '', 'Y', 'Y', '', '').subscribe(result => { this.dsImptCd = result.data; });

    // 창고
    this.bizService.getWh(this.G_TENANT).subscribe(result => { this.dsWhCd = result.data; });

    // 항구
    this.codeService.getCode(this.G_TENANT, 'PORT').subscribe(result => { this.dsPort = result.data; });

    // 전체수출사
    this.bizService.getCust(this.G_TENANT, '', 'Y', '', '', '', '').subscribe(result => { this.dsExptCdAll = result.data; });

    // 전체파트너사
    this.bizService.getCust(this.G_TENANT, 'Y', '', '', '', '', '').subscribe(result => { this.dsPtrnCdAll = result.data; });

    // 전체수입사
    this.bizService.getCust(this.G_TENANT, '', '', 'Y', '', '', '').subscribe(result => { this.dsImptCdAll = result.data; });
  }

  ngAfterViewInit(): void {
    this.initForm();

    this.utilService.getGridHeight(this.mainGrid);
  }

  // search Form 초기화
  initForm(): void {
    // 공통 조회 조건 set
    const rangeDate = this.utilService.getDateRange();

    this.fromOrdDate.value = rangeDate.fromDate;
    this.toOrdDate.value = rangeDate.toDate;

    if ( this.userGroup === '3' ) {
      this.mainForm.instance.getEditor('ptrnCd').option('value', this.userCompany);
      this.mainForm.instance.getEditor('ptrnCd').option('disabled', true);
    }
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
      this.mainFormData.fromOrdDate = document.getElementsByName('fromOrdDate').item(1).getAttribute('value');
      this.mainFormData.toOrdDate = document.getElementsByName('toOrdDate').item(1).getAttribute('value');

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

        var keys = this.mainGrid.instance.getSelectedRowKeys();
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

  // 작업상태 표현식
  // 주문구분명 표현식
  ordGbNm(rowData) {
    let nm: string = "";
    if (this.utilService.getLanguage() == 'ko') {
      if (rowData.ord_gb == "1") {
        nm = '판매';
      } else if (rowData.ord_gb == "2") {
        nm = '렌탈';
      } else if (rowData.ord_gb == "3") {
        nm = '견본,타계정';
      } else if (rowData.ord_gb == "4") {
        nm = '판매반품';
      } else if (rowData.ord_gb == "5") {
        nm = '렌탈반품';
      } else if (rowData.ord_gb == "6") {
        nm = '견본,타계정반품';
      }
    } else {
      if (rowData.ord_gb == "1") {
        nm = 'Sale';
      } else if (rowData.ord_gb == "2") {
        nm = 'Rental';
      } else if (rowData.ord_gb == "3") {
        nm = 'Sample';
      } else if (rowData.ord_gb == "4") {
        nm = 'SaleReturn'
      } else if (rowData.ord_gb == "5") {
        nm = 'RentalReturn'
      } else if (rowData.ord_gb == "6") {
        nm = 'SampleReturn'
      }
    }
    return nm;
  }

  onOptionChanged(e): void {
    this.gridUtil.onOptionChangedForSummary(e, this); // 합계 계산
  }

  calculateCustomSummary(options): void {
    this.gridUtil.setCustomSummary(options, this.mainGrid, this);
  }

}
