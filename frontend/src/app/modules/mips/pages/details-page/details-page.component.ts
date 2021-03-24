import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MipsService } from '../../services/mips.service';

@Component({
  selector: 'app-details-page',
  templateUrl: './details-page.component.html',
  styleUrls: ['./details-page.component.scss']
})
export class DetailsPageComponent implements OnInit {

  mip: any;
  sections: any;
  pullrequest: any;
  mipId: string;
  mipPosition: number;
  total: number;

  constructor(
    private mipsService: MipsService,
    private activedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.activedRoute.paramMap.subscribe(paramMap => {
      if (paramMap.has('id')) {
        this.mipId = paramMap.get('id');
        this.total = this.mipsService.getTotal();
        this.loadData();
        this.mipsService.updateActiveSearch(true);
        this.moveToElement();
      }
    });
  }

  loadData(): void {
    this.mipsService.getMip(this.mipId)
    .subscribe(data => {
      this.mip = data.mips;
      // const regEx = new RegExp('(.)*');
      // this.mip.file = this.mip.file.replace(regEx, ' ');
      this.sections = data.sections;
      this.pullrequest = data.pullRequests;

      if (this.mipsService.getMipsData() === undefined) {
        this.getMips();
      }
    });
    const data = this.mipsService.getMipsData();

    if (data !== undefined) {
      this.mipPosition = data.findIndex(item => item._id === this.mipId);
    }
  }

  mipsPagination(position: number): void {
    const data = this.mipsService.getMipsData();
    this.mipId = data[position]._id;
    this.loadData();
  }

  moveToElement(): void {
    const el = document.getElementById('logo');
    el.scrollIntoView();
  }

  getMips(): void {
    let order = 'mip';
    let filter = {
      contains: [],
      notcontains: [],
      equals: [],
      notequals: [],
      inarray: []
    };

    filter.notequals.push({field: 'mip', value: -1});

    if (this.mip.proposal === '') {
      filter.equals.push({field: 'proposal', value: ""});
    } else {
      order = 'mip subproposal';
    }

    this.searchMips(0, 0, order, '', filter);
  }

  searchMips(limit, page, order, search, filter): void {
    this.mipsService.searchMips(limit, page, order, search, filter)
    .subscribe(data => {
      this.mipsService.setMipsData(data.items);
      this.total = data.total;
      this.mipsService.setTotal(this.total);
      const mips = this.mipsService.getMipsData();
      this.mipPosition = mips.findIndex(item => item._id === this.mipId);
    });
  }

}
