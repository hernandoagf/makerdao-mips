import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  EventEmitter,
  Output,
  ComponentFactoryResolver,
  Injector,
} from '@angular/core';

import { environment } from '../../../../../environments/environment';
import { MarkdownService } from 'ngx-markdown';
import { ActivatedRoute, Router } from '@angular/router';
import { MipsService } from '../../services/mips.service';
import {
  FlexibleConnectedPositionStrategyOrigin,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { UrlService } from 'src/app/services/url/url.service';
import { SubproposalsComponent } from '../subproposals/subproposals.component';

const preambleDataSample = [
  {
    key: 'MIP#',
    value: '2',
  },
  {
    key: 'Title',
    value: 'Launch Period',
  },
  {
    key: 'Author(s)',
    value: 'Rune Christensen (@Rune23), Charles St.Louis (@CPSTL)',
  },
  {
    key: 'Contributors',
    value: 'Rune Christensen (@Rune23), Charles St.Louis (@CPSTL)',
  },
  {
    key: 'Type',
    value: 'Process',
  },
  {
    key: 'Status',
    value: 'Accepted',
  },
  {
    key: 'Date Proposed',
    value: '2020-04-06',
  },
  {
    key: 'Date Ratified',
    value: '2020-05-02',
  },
  {
    key: 'Dependencies',
    value: 'MIP0, MIP1',
  },
  {
    key: 'Replaces',
    value: 'n/a',
  },
];

@Component({
  selector: 'app-detail-content',
  templateUrl: './detail-content.component.html',
  styleUrls: ['./detail-content.component.scss'],
})
export class DetailContentComponent
  implements OnInit, OnChanges, AfterViewInit {
  gitgubUrl = environment.repoUrl;
  @Input() mdUrl: string | undefined;
  mdFileName: string = '';

  @Input() mip: any;
  @Output() headingListUpdate = new EventEmitter();

  urlOriginal: string;
  links: Link[] = [];
  countLinks: number = 0;
  @ViewChild('preview') preview: TemplateRef<any>;
  overlayRef: OverlayRef | null;
  templatePortal: TemplatePortal<any>;
  content: any;
  triangleUp: boolean;
  triangleLeft: boolean;
  @Input() subproposals: any[] = [];
  subscription: Subscription;
  @ViewChild('previewRef') previewRef: ElementRef;
  subproposalCode: string = '';
  subproposalTitle: string = '';

  headingStructure: Heading[] = [];
  subproposalsGroup: any = {};

  constructor(
    private markdownService: MarkdownService,
    private router: Router,
    private route: ActivatedRoute,
    private mipsService: MipsService,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    private titleService: Title,
    private urlService: UrlService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {}

  ngOnInit(): void {
    this.overrideDefaultHeadings();
    this.getDefaultLinks();
    this.overrideDefaultTables();
    this.overrideDefaultImg();
  }

  ngAfterViewInit() {
    if (this.route.snapshot.fragment) {
      const el = document.getElementById(
        this.route.snapshot.fragment.toString()
      );

      this.moveToElement(el);
    }
  }

  setPreviewFeature() {
    let links = document.getElementsByClassName('linkPreview');

    for (let index = 0; index < links.length; index++) {
      const element = links.item(index);
      element.addEventListener('mouseover', this.displayPreview);
      element.addEventListener('mouseleave', this.closePreview);
    }
  }

  showOverview(data, posStrategy) {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(posStrategy)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
        },
      ]);

    positionStrategy.positionChanges.subscribe((pos) => {
      if (
        pos.connectionPair.originX === 'end' &&
        pos.connectionPair.originY === 'bottom' &&
        pos.connectionPair.overlayX === 'end' &&
        pos.connectionPair.overlayY === 'top'
      ) {
        this.triangleUp = true;
        this.triangleLeft = false;
      } else if (
        pos.connectionPair.originX === 'start' &&
        pos.connectionPair.originY === 'bottom' &&
        pos.connectionPair.overlayX === 'start' &&
        pos.connectionPair.overlayY === 'top'
      ) {
        this.triangleUp = true;
        this.triangleLeft = true;
      } else if (
        pos.connectionPair.originX === 'end' &&
        pos.connectionPair.originY === 'top' &&
        pos.connectionPair.overlayX === 'end' &&
        pos.connectionPair.overlayY === 'bottom'
      ) {
        this.triangleUp = false;
        this.triangleLeft = false;
      } else if (
        pos.connectionPair.originX === 'start' &&
        pos.connectionPair.originY === 'top' &&
        pos.connectionPair.overlayX === 'start' &&
        pos.connectionPair.overlayY === 'bottom'
      ) {
        this.triangleUp = false;
        this.triangleLeft = true;
      }

      let element: HTMLElement = this.previewRef.nativeElement.parentElement
        .parentElement;
      element.style.marginTop = '17px';
      element.style.marginBottom = '17px';
    });

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    this.overlayRef.attach(
      new TemplatePortal(this.preview, this.viewContainerRef, {
        $implicit: data,
      })
    );
  }

  displayPreview = (e: Event) => {
    if (!this.overlayRef) {
      const link = e.target as HTMLAnchorElement;

      let href: string = link.href.split('/mips/details/')[1];

      if (link?.rel?.includes('smart-')) {
        const type = link.rel.split('-')[1];

        switch (type) {
          case 'Mip':
            const mipNameMatches = link.href.match(/MIP\d+/gi);

            if (mipNameMatches) {
              const mipName = mipNameMatches[0];
              this.subscription = this.mipsService
                .getMipBy('mipName', mipName)
                .subscribe((data) => {
                  if (data) {
                    let posStrategy: FlexibleConnectedPositionStrategyOrigin = e.target as HTMLElement;

                    this.showOverview(data, posStrategy);
                  }
                });
            }

            break;

          case 'Component':
            const mipComponentMatches = link.href.match(/MIP\d+c\d+/gi);

            if (mipComponentMatches) {
              const mipComponent = mipComponentMatches[0];
              this.subscription = this.mipsService
                .getMipBy('mipComponent', mipComponent)
                .subscribe((data) => {
                  if (data) {
                    let posStrategy: FlexibleConnectedPositionStrategyOrigin = e.target as HTMLElement;

                    this.showOverview(data, posStrategy);
                  }
                });
            }
            break;

          case 'Subproposal':
            const mipSubproposalMatch = link.href.match(/MIP\d+c\d+-SP\d+/gi);

            if (mipSubproposalMatch) {
              const mipSubproposal = mipSubproposalMatch[0];

              this.subscription = this.mipsService
                .getMipBy('mipSubproposal', mipSubproposal)
                .subscribe((data) => {
                  if (data) {
                    let posStrategy: FlexibleConnectedPositionStrategyOrigin = e.target as HTMLElement;

                    this.showOverview(data, posStrategy);
                  }
                });
            }
            break;
        }
      } else if (href) {
        this.subscription = this.mipsService
          .getMipBy('mipName', href)
          .subscribe((data) => {
            if (data) {
              let posStrategy: FlexibleConnectedPositionStrategyOrigin = e.target as HTMLElement;

              this.showOverview(data, posStrategy);
            }
          });
      }
    }
  };

  closePreview = (e: Event) => {
    if (this.subscription && !this.subscription.closed) {
      this.subscription.unsubscribe();
    }

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  };

  ngOnChanges() {
    if (this.mip && this.mip?.sectionsRaw) {
      this.content = this.mip?.title
        ? (this.mip?.sectionsRaw as []).slice(1).join('\n')
        : (this.mip?.sectionsRaw as []).join('\n');

      if (this.mip?.proposal && this.mip?.title) {
        let subProposalTitleArray: string[] = this.mip?.title.split(':');
        this.subproposalCode = subProposalTitleArray[0];
        this.subproposalTitle = subProposalTitleArray.slice(1).join('');
      }
      this.titleService.setTitle(
        this.mip?.proposal
          ? this.mip?.title
          : this.mip?.mipName + ': ' + this.mip?.title
      );
    }

    this.getDefaultLinks();
    this.overrideDefaultHeadings();
    this.overrideDefaultTables();
    this.overrideDefaultImg();

    this.urlOriginal =
      this.urlService.getGithubLinkFromMdRaw(this.mdUrl) || this.mdUrl;

    const nameMdMatch: RegExpMatchArray = this.mdUrl?.match(/\/[\w\s-]+\.md/g);

    if (nameMdMatch && nameMdMatch[0]) {
      this.mdFileName = nameMdMatch[0].replace('/', '');
    }
  }

  onReady() {
    if (this.mdUrl) {
      this.headingListUpdate.emit(this.headingStructure);
    }
    if (this.route.snapshot.fragment) {
      const el = document.getElementById(
        this.route.snapshot.fragment.toString()
      );

      this.moveToElement(el);
    }
    this.headingStructure = [];
    if (!this.mdUrl) {
      //On md viewer THERE IS NOT NEED of THIS and may cuse a problem with md relatives links
      this.searchMips();
    }
    this.setPreviewFeature();
    this.appendSubproposalsElements();
  }

  appendSubproposalsElements() {
    if (this.subproposals) {
      this.subproposals.map((item) => {
        let newItem = this.addSubsetField(item);
        return newItem;
      });

      let subproposalsGroup: any = this.groupBy('subset', this.subproposals);

      this.sortSubproposalsGroups(subproposalsGroup);
      this.subproposalsGroup = subproposalsGroup;

      // DOM manipulation
      let m: HTMLElement = document.querySelector('.variable-binding');
      let h3s: HTMLCollectionOf<HTMLHeadingElement> = m.getElementsByTagName(
        'h3'
      );

      for (const key in this.subproposalsGroup) {
        if (Object.prototype.hasOwnProperty.call(this.subproposalsGroup, key)) {
          for (let i = 0; i < h3s.length; i++) {
            const element = h3s.item(i);
            if (element.innerText.startsWith(key)) {
              const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
                SubproposalsComponent
              );
              const componentRef = componentFactory.create(this.injector);
              componentRef.instance.subproposals = [
                ...this.subproposalsGroup[key],
              ];
              componentRef.hostView.detectChanges();
              const { nativeElement } = componentRef.location;

              // search in DOM the next component section
              let found: boolean = false;
              let j: number = i + 1;
              while (j < h3s.length && !found) {
                const nextElement: HTMLHeadingElement = h3s.item(j);

                if (nextElement.innerText.startsWith(this.mip.mipName)) {
                  found = true;
                  let prev = nextElement.previousElementSibling;

                  if (prev.tagName === 'HR') {
                    prev.insertAdjacentElement('beforebegin', nativeElement);
                  } else {
                    prev.insertAdjacentElement('afterend', nativeElement);
                  }
                }

                j++;
              }

              if (j >= h3s.length && !found) {
                let lastChild = m.lastElementChild;

                if (lastChild.tagName === 'HR') {
                  lastChild.insertAdjacentElement('beforebegin', nativeElement);
                } else {
                  lastChild.insertAdjacentElement('afterend', nativeElement);
                }
              }
            }
          }
        }
      }
    }
  }

  addSubsetField = (item: any) => {
    let subset: string = (item.mipName as string).split('SP')[0];
    item.subset = subset;
    return item;
  };

  groupBy(field, arr: any[]): any {
    let group: any = arr.reduce((r, a) => {
      r[a[field]] = [...(r[a[field]] || []), a];
      return r;
    }, {});

    return group;
  }

  sortSubproposalsGroups(subproposalsGroup: any) {
    for (const key in subproposalsGroup) {
      if (Object.prototype.hasOwnProperty.call(subproposalsGroup, key)) {
        let element: any[] = subproposalsGroup[key];
        subproposalsGroup[key] = this.sortSubproposalGroup(element);
      }
    }
  }

  sortSubproposalGroup(arr: any[]) {
    return arr.sort(function (a: any, b: any) {
      return (a.mipName as string).includes('SP') &&
        a.mipName.split('SP').length > 1
        ? +a.mipName.split('SP')[1] < +b.mipName.split('SP')[1]
          ? -1
          : 1
        : 1;
    });
  }

  onError() {
    this.router.navigateByUrl('/');
    setTimeout(() => {
      //To avoid the race issue

      this.router.navigateByUrl('page-not-found');
    }, 0);
  }

  moveToElement(el: HTMLElement): void {
    if (el) {
      el.scrollIntoView();
    }
  }

  overrideDefaultHeadings() {
    let url = this.router.url.split('#')[0];

    this.markdownService.renderer.heading = (
      text: string,
      level: number,
      raw: string
    ) => {
      const matchMipComponentName = text?.match(
        /^(?<mipComponent>MIP\d+[ca]\d+)\s?:/i
      );
      const mipComponent = matchMipComponentName?.groups?.mipComponent;

      const htmlCleanedText = raw.replace(/<[^<>]+>/gm, '');
      const escapedText = mipComponent
        ? mipComponent
        : htmlCleanedText.toLowerCase().replace(/[^\w]+/g, '-');

      let style: string = '';

      if (this.mip?.title?.localeCompare(text) === 0) {
        style = `style="display:none;"`;
      }

      this.headingStructure.push({ heading: htmlCleanedText, depth: level });

      return `
             <h${level} ${style}>
               <a name="${escapedText}" id="${escapedText}" class="anchor" href="${url}#${escapedText}">
                 <i id="${escapedText}" class="fas fa-link"></i>
               </a>${text}</h${level}>`;
    };
  }

  overrideDefaultTables() {
    this.markdownService.renderer.table = (header: string, body: string) => {
      return `<div style="overflow-x:auto; margin-bottom: 16px;">
                <table>
                  <thead>${header}</thead>
                  <tbody>${body}</tbody>
                </table>
              </div>`;
    };
  }

  overrideDefaultImg() {
    this.markdownService.renderer.image = (
      href: string,
      title: string,
      text: string
    ) => {
      return `<img src="${href}?raw=true">`;
    };
  }

  getDefaultLinks() {
    this.links = [];

    this.markdownService.renderer.link = (
      href: string,
      title: string,
      text: string
    ) => {
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
      let id: string = `md-${escapedText}${this.countLinks++}`;

      let link: Link = {
        id: id,
        name: text,
        link: href,
      };

      this.links.push({ ...link });

      if (
        !link.name.includes('Template') &&
        (link.link.includes(this.gitgubUrl) ||
          title?.includes('smart') ||
          link.link.match(/MIP\d+(?:[ca]\d+)?(?:-SP\d+)?/gi) ||
          link.link.includes('https://github.com/makerdao/mips/blob') ||
          link.link.includes('https://github.com/makerdao/mips/tree') ||
          link.link.includes('https://forum.makerdao.com'))
      ) {
        if (title?.includes('smart')) {
          console.log('ver', link);
          return `<a onclick="return;" name="${
            title?.includes('smart') ? title : escapedText
          }" id="${link.id}" class="linkPreview showAsBacktip" rel=${
            title?.includes('smart') ? title : ''
          } href="${href}">${text}</a>`;
        } else {
          return `<a name="${escapedText}" id="${link.id}" class="linkPreview"
          } href="${href}">${text}</a>`;
        }
      }

      if (this.mdUrl) {
        //MD VIEWER BEHAVIOR
        if (!href.includes('https://')) {
          //I asume a github md relative link

          const baseUrl = this.mdUrl.replace(/\/?[\w-#\.\s]+$/g, '');

          if (!href.includes('.md')) {
            //Relarive reference only link ex: #last-thing
            href =
              this.urlService.mdViewerRoute +
              baseUrl +
              '/' +
              this.mdFileName +
              href;
          } else {
            href =
              this.urlService.mdViewerRoute +
              baseUrl +
              '/' +
              href.replace(/^\//, '');
          }
        } else {
          // A non relative link
          href = this.urlService.transformLinkForMd(href);
        }
      }
      return `<a name="${escapedText}" id="${link.id}" class="anchor-link" href="${href}">${text}</a>`;
    };
  }

  searchMipsByNameAndOverrideLink(
    limit,
    page,
    order,
    search,
    filter,
    link: Link
  ): void {
    this.mipsService
      .searchMips(limit, page, order, search, filter)
      .subscribe((data) => {
        if (data.items && data.items[0]) {
          // override link in DOM
          let elem = document.getElementById(link.id);
          elem.setAttribute('href', '/mips/details/' + data.items[0].mipName);
        }
      });
  }

  searchMips() {
    this.links.forEach((link) => {
      let elem = document.getElementById(link.id);

      if (!link.name.includes('Template')) {
        if (
          link.link.includes(this.gitgubUrl) ||
          link.link.includes('https://github.com/makerdao/mips/blob') ||
          link.link.includes('https://github.com/makerdao/mips/tree') ||
          link.link.includes('https://forum.makerdao.com')
        ) {
          if (link.link.includes('MIP')) {
            const mip = link.link.replace(`${this.gitgubUrl}/`, '').split('#');

            if (mip?.length > 0) {
              this.mipsService
                .getMipByFilename(mip[0], 'filename')
                .subscribe((data) => {
                  if (mip?.length > 1) {
                    elem.setAttribute(
                      'href',
                      `/mips/details/${data.mipName}#${mip[1]}`
                    );
                  } else {
                    elem.setAttribute('href', `/mips/details/${data.mipName}`);
                  }
                });
            }
          } else {
            const field = 'mipName';
            const fieldValue = link.name.trim();

            this.mipsService
              .getMipByFilename(fieldValue, field)
              .subscribe((data) => {
                if (data.mipName) {
                  elem.setAttribute('href', `/mips/details/${data.mipName}`);
                } else {
                  elem.setAttribute(
                    'href',
                    `${this.gitgubUrl}/${this.mip?.filename}`
                  );
                }
              });
          }
        } else {
          if (
            !link.link.includes('https') &&
            !link.link.match(/mips\/details\/MIP\d/gi)
          ) {
            elem.setAttribute(
              'href',
              `${this.gitgubUrl}/${this.mip?.mipName}/${link.link}`
            );
          }
        }
      } else {
        if (link.name.includes('.md') && !link.link.includes('https')) {
          elem.setAttribute(
            'href',
            `${this.gitgubUrl}/${this.mip?.mipName}/${link.name}`
          );
        } else if (!link.link.includes('https')) {
          elem.setAttribute(
            'href',
            `${this.gitgubUrl}/${this.mip?.mipName}/${link.name}.md`
          );
        }
        // else {
        //   elem.setAttribute(
        //     'href',
        //     `${this.gitgubUrl}/${this.mip?.mipName}/${link.name}.md`
        //   );
        // }
      }
    });
  }

  ngOnDestroy() {
    this.titleService.setTitle('MIPs Portal');
  }
}

interface Link {
  id: string;
  name: string;
  link: string;
}

interface Heading {
  heading: string;
  depth: number;
}
