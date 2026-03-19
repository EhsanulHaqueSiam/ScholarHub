"""Scrapy settings for scholarhub_scraping project."""

BOT_NAME = "scholarhub_scraping"

SPIDER_MODULES = ["scholarhub_scraping.spiders"]
NEWSPIDER_MODULE = "scholarhub_scraping.spiders"

ROBOTSTXT_OBEY = True

CONCURRENT_REQUESTS = 8
DOWNLOAD_DELAY = 1.0

REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
