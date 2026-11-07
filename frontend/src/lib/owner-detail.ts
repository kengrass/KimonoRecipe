/**
 * 本人用詳細フル ↔ 公開本文／所有者フィールドの分解。
 * 公開 API に非公開を混ぜない。本人用は全文＋所有者専用（項目重複あり）。
 */
import type {
  OwnerCoordinateDetail,
  OwnerCoordinateFields,
  OwnerItemDetail,
  OwnerItemFields,
  PublicCoordinateDetail,
  PublicItemDetail,
} from "@/lib/types";

export function ownerCoordinateFieldsFromDetail(
  detail: OwnerCoordinateDetail,
): OwnerCoordinateFields {
  return {
    id: detail.id,
    edit_url: detail.edit_url,
    add_coordinate_item_url: detail.add_coordinate_item_url,
    private_note: detail.private_note,
    owner_status: detail.owner_status,
    updated_at: detail.updated_at,
    view_count: detail.view_count,
    worn_on: detail.worn_on,
    is_temp: detail.is_temp,
  };
}

export function ownerItemFieldsFromDetail(
  detail: OwnerItemDetail,
): OwnerItemFields {
  return {
    id: detail.id,
    edit_url: detail.edit_url,
    add_used_coordinate_url: detail.add_used_coordinate_url,
    private_note: detail.private_note,
    owner_status: detail.owner_status,
    updated_at: detail.updated_at,
    view_count: detail.view_count,
    favorite_rank: detail.favorite_rank,
    declutter_candidate: detail.declutter_candidate,
  };
}

export function publicCoordinateFromOwner(
  detail: OwnerCoordinateDetail,
): PublicCoordinateDetail {
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    images: detail.images,
    user: detail.user,
    posted_at: detail.posted_at,
    tags: detail.tags,
    like_count: detail.like_count,
    gender: detail.gender,
    obi_knot: detail.obi_knot,
    items: detail.items,
    related_coordinates: detail.related_coordinates,
    og: detail.og,
  };
}

export function publicItemFromOwner(detail: OwnerItemDetail): PublicItemDetail {
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    category: detail.category,
    images: detail.images,
    user: detail.user,
    posted_at: detail.posted_at,
    tags: detail.tags,
    like_count: detail.like_count,
    gender: detail.gender,
    used_in_coordinates: detail.used_in_coordinates,
    related_items: detail.related_items,
    og: detail.og,
  };
}
