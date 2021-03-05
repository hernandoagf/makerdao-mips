import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

import * as crypto from "crypto";

import { MIPsService } from "./services/mips.service";
import { ParseMIPsService } from "./services/parse-mips.service";
import { PullRequestService } from "./services/pull-requests.service";

import { Env } from "@app/env";
import { Filters, PaginationQueryDto } from "./dto/query.dto";


@Controller("mips")
export class MIPsController {
  constructor(
    private mipsService: MIPsService,
    private parseMIPsService: ParseMIPsService,
    private pullRequestService: PullRequestService,
    private configService: ConfigService    
  ) {}

  @Get("findall")
  @ApiQuery({
    name: "limit",
    description: "Limit per page, default value 10",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "page",
    description: "Page, default value equal to zero",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "order",
    description: `'title -mip', means: order property title ASC and mip DESC`,
    type: String,
    required: false,
  })
  @ApiQuery({
    name: "search",
    description:
      'The search field treats most punctuation in the string as delimiters, except a hyphen-minus (-) that negates term or an escaped double quotes (\\ ") that specifies a phrase',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: "filter",
    description:
      "Filter field with various filter patterns. (contains, notcontains, equals, notequals)",
    required: false,
    type: "object",
    schema: {
      type: "object",
      example: {
        filter: {
          contains: [{ field: "title", value: "Proposal" }],
          notcontains: [{ field: "title", value: "subproposal" }],
          equals: [{ field: "mip", value: -1 }],
          notequals: [{ field: "mip", value: -1 }],
        },
      },
    },
  })
  async findAll(
    @Query("limit") limit?: string,
    @Query("page") page?: string,
    @Query("order") order?: string,
    @Query("search") search?: string,
    @Query("filter") filter?: Filters
  ) {
    try {
      const paginationQueryDto: PaginationQueryDto = {
        limit: +limit || 10,
        page: +page,
      };

      const items = await this.mipsService.findAll(
        paginationQueryDto,
        order,
        search,
        filter
      );
      const total = await this.mipsService.count(search, filter);
      return { items, total };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get("findone/:id")
  async findOne(@Param("id") id: string) {
    if (!this.mipsService.isValidObjectId(id)) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Invalid decoding ID ${id}`,
        },
        HttpStatus.BAD_REQUEST
      );
    }
    let mips = await this.mipsService.findOne(id); 
    let sections;

    if (!mips) {
      throw new NotFoundException(`MIPs with ${id} not found`);
    }
    sections = await this.parseMIPsService.parseSections(mips.filename);
    return { mips, sections }    
  }

  @Get("pullrequests")
  findPullRequests() {
    return this.pullRequestService.findOne();
  }

  @Post("callback")
  async callback(@Req() { headers, body }: any): Promise<boolean> {
    try {
      const secretToken = this.configService.get<string>(
        Env.WebhooksSecretToken
      );

      const hmac = crypto.createHmac("sha1", secretToken);
      const selfSignature = hmac.update(JSON.stringify(body)).digest("hex");
      const comparisonSignature = `sha1=${selfSignature}`; // shape in GitHub header

      const signature = headers["x-hub-signature"];

      if (!signature) {
        return false;
      }

      const source = Buffer.from(signature);
      const comparison = Buffer.from(comparisonSignature);

      if (!crypto.timingSafeEqual(source, comparison)) {
        return false;
      }

      this.parseMIPsService.loggerMessage("Webhooks works");

      return this.parseMIPsService.parse();
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}