import { esClient } from "../config/elasticsearch";
import { Event } from "../entities/Event";
import { SearchEventInput } from "../types/SearchEventInput";

export class EventSearchService {
  private index = "events";

  async indexEvent(event: Event) {
    await esClient.index({
      index: this.index,
      id: event.id.toString(),
      document: {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        date: event.date,
        categoryId: event.category?.id,
        categoryName: event.category?.name,
        organizerName: event.organizer?.name,
      },
    });
  }

  async removeEvent(eventId: number) {
    await esClient.delete({
      index: this.index,
      id: eventId.toString(),
    });
  }

  async searchEvent(input: SearchEventInput) {
    const mustQuery: any[] = [];
    const filterQuery: any[] = [];

    if (input.keyword) {
      mustQuery.push({
        multi_match: {
          query: input.keyword,
          fields: [
            "title^3",
            "description",
            "location",
            "categoryName",
            "organizerName",
          ],
          fuzziness: "AUTO",
        },
      });
    } else {
      mustQuery.push({ match_all: {} });
    }

    if (input.location) {
      mustQuery.push({
        match: {
          location: input.location,
        },
      });
    }

    if (input.categoryId) {
      filterQuery.push({
        term: { categoryId: input.categoryId },
      });
    }

    if (input.startDate || input.endDate) {
      const rangeConfig: any = {};
      if (input.startDate) rangeConfig.gte = input.startDate;
      if (input.endDate) rangeConfig.lte = input.endDate;

      filterQuery.push({
        range: { date: rangeConfig },
      });
    }

    const result = await esClient.search({
      index: this.index,
      query: {
        bool: {
          must: mustQuery,
          filter: filterQuery,
        },
      },
    });

    return result.hits.hits.map((hit: any) => ({
      ...hit._source,
      id: hit._source.id || parseInt(hit._id),
    }));
  }
}
