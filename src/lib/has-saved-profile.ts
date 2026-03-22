export type SavedProfileShape = {
  display_name?: string | null;
  main_character?: string | null;
  sub_character?: string | null;
  bio?: string | null;
};

export function hasSavedProfile(data: SavedProfileShape | null) {
  if (!data) {
    return false;
  }

  return Boolean(
    data.display_name?.trim() ||
      data.main_character?.trim() ||
      data.sub_character?.trim() ||
      data.bio?.trim(),
  );
}
