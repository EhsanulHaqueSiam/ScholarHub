"""Scrapy item definitions for scholarship data."""

import scrapy


class ScholarshipItem(scrapy.Item):
    """Raw scholarship data scraped from a source."""

    title = scrapy.Field()
    description = scrapy.Field()
    provider_organization = scrapy.Field()
    host_country = scrapy.Field()
    eligibility_nationalities = scrapy.Field()
    degree_levels = scrapy.Field()
    fields_of_study = scrapy.Field()
    funding_type = scrapy.Field()
    funding_tuition = scrapy.Field()
    funding_living = scrapy.Field()
    funding_travel = scrapy.Field()
    funding_insurance = scrapy.Field()
    award_amount = scrapy.Field()
    award_currency = scrapy.Field()
    application_deadline = scrapy.Field()
    application_url = scrapy.Field()
    source_url = scrapy.Field()
    external_id = scrapy.Field()
    raw_data = scrapy.Field()
