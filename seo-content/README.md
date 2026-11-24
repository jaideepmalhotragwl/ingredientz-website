# SEO content for product pages

One file per product, named `<product-slug>.json`. When a product has a file
here, `generate-product-pages.js` builds its page with the richer layout:
custom title and description, sections, a spec table, FAQs and FAQ markup.

Products without a file keep the standard layout. Nothing here changes the
database. A page changes on the live site only after the site is redeployed.

## Fields

All fields are optional except `slug`.

| Field | What it does |
| --- | --- |
| `slug` | The product's slug, exactly as in the product database |
| `updated` | Date of the last content change, `YYYY-MM-DD`. Used as the sitemap date |
| `seo_title` | Title shown in Google. Keep under about 60 characters |
| `meta_description` | Description shown in Google. Keep under about 160 characters |
| `h1` | Main heading on the page. Defaults to the product name |
| `lead` | Short line under the heading. Defaults to the short description |
| `tags` | Small labels under the lead |
| `key_details` | Up to four `[label, value]` boxes. Defaults to MOQ, Unit, CAS, HSN |
| `intro` | Opening paragraphs |
| `sections` | Each has `heading`, and any of `paragraphs`, `bullets`, `table`, and a `note` shown under the table |
| `faqs` | List of `{ "q": ..., "a": ... }`. Also written as FAQ markup |
| `cta` | Line above the final Request a Quote button |
| `related_links` | Hand-picked links, `{ "href": ..., "label": ... }`. Shown first in Related products; automatic links fill the rest, up to six in total |
| `price_from_usd` | A real published "from" price per unit. Adds a price to the product markup. Leave out unless the price is public |

A bullet is either a plain string or a `[bold label, text]` pair.
A table has `columns` and `rows`. A row with only a label and one value
spans all the value columns.

## Rules

- Only state facts that are true and that the company is happy to publish.
- No health claims. Describe what the ingredient is and how it is used.
- Never invent a price.

## Related products

Every product page links to up to six others. Products that share a
meaningful word in their name come first (Coconut Water Powder links to
Coconut Milk Powder), then products from the same category.
