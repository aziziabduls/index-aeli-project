"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getClientCookie } from "@/lib/cookie.client";

interface ItineraryItem {
  location_name: string;
  unique_feature: string;
  activity_challenge: string;
}

interface RundownItem {
  time_label: string;
  duration_minutes: number;
  session_activity: string;
  location: string;
  facilitator_notes: string;
}

interface ProgramFormProps {
  initialData?: {
    id?: string;
    provider_id: string;
    destination_id: string | null;
    attraction_id?: string | null;
    name: string;
    category: string;
    location_label: string;
    short_description: string;
    overview: string | null;
    highlights: string[] | null;
    price_min: string | number | null;
    price_max: string | number | null;
    price_unit: string | null;
    price_note: string | null;
    duration_label: string;
    max_guest_min: number | null;
    max_guest_max: number | null;
    meeting_point: string | null;
    status: string;
    itinerary?: ItineraryItem[];
    rundown?: RundownItem[];
    included?: string[];
    excluded?: string[];
    image?: string;
    gallery?: string[];
  };
  providers: { id: string; legal_name: string }[];
  destinations: { id: string; name: string }[];
  attractions: { id: string; destination_id: string; name: string }[];
  categories: { id?: string; name: string }[];
}

export function ProgramForm({ initialData, providers, destinations, attractions, categories }: ProgramFormProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  // Form State
  let defaultProviderId = "";
  if (initialData) {
    defaultProviderId = initialData.provider_id;
  } else if (providers[0]) {
    defaultProviderId = providers[0].id;
  }

  const fallbackCategories = [
    "Adventure & Challenge",
    "Cultural Immersion",
    "Community & Social Impact",
    "Nature & Eco Experience",
    "Culinary Journey",
  ];

  const standardCategories = categories.length > 0 ? categories.map((c) => c.name) : fallbackCategories;

  const isInitialCategoryCustom = initialData?.category && !standardCategories.includes(initialData.category);

  let initialCategoryVal = "Adventure & Challenge";
  if (isInitialCategoryCustom) {
    initialCategoryVal = "custom";
  } else if (initialData) {
    initialCategoryVal = initialData.category;
  }

  const [name, setName] = useState(initialData ? initialData.name : "");
  const [category, setCategory] = useState(initialCategoryVal);
  const [customCategory, setCustomCategory] = useState(
    isInitialCategoryCustom && initialData ? initialData.category : "",
  );
  const [formId] = useState(initialData?.id ?? crypto.randomUUID());
  const [image, setImage] = useState(initialData?.image ?? "");
  const [gallery, setGallery] = useState<string[]>(initialData?.gallery ?? []);
  const [providerId, setProviderId] = useState(defaultProviderId);
  const [destinationId, setDestinationId] = useState(initialData ? (initialData.destination_id ?? "") : "");
  const [attractionId, setAttractionId] = useState(initialData ? (initialData.attraction_id ?? "") : "");

  const handleDestinationChange = (val: string) => {
    setDestinationId(val);
    setAttractionId("");
  };

  const filteredAttractions = attractions.filter((a) => a.destination_id === destinationId);

  const [locationLabel, setLocationLabel] = useState(initialData ? initialData.location_label : "");
  const [durationLabel, setDurationLabel] = useState(initialData ? initialData.duration_label : "");
  const [shortDescription, setShortDescription] = useState(initialData ? initialData.short_description : "");
  const [overview, setOverview] = useState(initialData ? (initialData.overview ?? "") : "");

  // Highlights (saved as text[], input as new-line separated)
  const [highlightsText, setHighlightsText] = useState(
    initialData?.highlights ? initialData.highlights.join("\n") : "",
  );

  // Pricing State
  const [priceMin, setPriceMin] = useState<number | "">(
    initialData?.price_min !== null && initialData?.price_min !== undefined ? Number(initialData.price_min) : "",
  );
  const [priceMax, setPriceMax] = useState<number | "">(
    initialData?.price_max !== null && initialData?.price_max !== undefined ? Number(initialData.price_max) : "",
  );
  const [priceUnit, setPriceUnit] = useState(initialData ? (initialData.price_unit ?? "per pax") : "per pax");
  const [priceNote, setPriceNote] = useState(initialData ? (initialData.price_note ?? "") : "");

  // Capacity & Location
  const [maxGuestMin, setMaxGuestMin] = useState<number | "">(
    initialData?.max_guest_min !== null && initialData?.max_guest_min !== undefined ? initialData.max_guest_min : "",
  );
  const [maxGuestMax, setMaxGuestMax] = useState<number | "">(
    initialData?.max_guest_max !== null && initialData?.max_guest_max !== undefined ? initialData.max_guest_max : "",
  );
  const [meetingPoint, setMeetingPoint] = useState(initialData ? (initialData.meeting_point ?? "") : "");
  const [status, setStatus] = useState(initialData ? initialData.status : "draft");

  // Dynamic lists State
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialData?.itinerary ?? []);
  const [rundown, setRundown] = useState<RundownItem[]>(initialData?.rundown ?? []);
  const [included, setIncluded] = useState<string[]>(initialData?.included ?? []);
  const [excluded, setExcluded] = useState<string[]>(initialData?.excluded ?? []);

  const [loading, setLoading] = useState(false);

  // Itinerary Handlers
  const addItineraryStop = () => {
    setItinerary([...itinerary, { location_name: "", unique_feature: "", activity_challenge: "" }]);
  };

  const removeItineraryStop = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index));
  };

  const updateItineraryStop = (index: number, field: keyof ItineraryItem, value: string) => {
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setItinerary(updated);
  };

  const moveItinerary = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === itinerary.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...itinerary];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setItinerary(updated);
  };

  // Rundown Handlers
  const addRundownItem = () => {
    setRundown([
      ...rundown,
      { time_label: "", duration_minutes: 0, session_activity: "", location: "", facilitator_notes: "" },
    ]);
  };

  const removeRundownItem = (index: number) => {
    setRundown(rundown.filter((_, i) => i !== index));
  };

  const updateRundownItem = (index: number, field: keyof RundownItem, value: string | number) => {
    const updated = [...rundown];
    // biome-ignore lint/suspicious/noExplicitAny: field key mapping is safe here
    (updated[index] as any)[field] = value;
    setRundown(updated);
  };

  const moveRundown = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === rundown.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...rundown];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setRundown(updated);
  };

  // Include/Exclude Handlers
  const addInclude = () => setIncluded([...included, ""]);
  const removeInclude = (index: number) => setIncluded(included.filter((_, i) => i !== index));
  const updateInclude = (index: number, value: string) => {
    const updated = [...included];
    updated[index] = value;
    setIncluded(updated);
  };

  const addExclude = () => setExcluded([...excluded, ""]);
  const removeExclude = (index: number) => setExcluded(excluded.filter((_, i) => i !== index));
  const updateExclude = (index: number, value: string) => {
    const updated = [...excluded];
    updated[index] = value;
    setExcluded(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = category === "custom" ? customCategory : category;

    if (!name.trim()) return toast.error("Program Name is required");
    if (!finalCategory.trim()) return toast.error("Category is required");
    if (!providerId) return toast.error("Provider is required");
    if (!locationLabel.trim()) return toast.error("Location Label is required");
    if (!shortDescription.trim()) return toast.error("Short Description is required");
    if (!durationLabel.trim()) return toast.error("Duration is required");

    // Price validation: either price_note is filled or price_min is set
    if (!priceNote.trim() && (priceMin === "" || priceMin === null)) {
      return toast.error("Please enter either a Minimum Price or a Price Note (e.g. 'By quotation')");
    }

    // Validate no empty lines in include/exclude lists
    if (included.some((item) => !item.trim()) || excluded.some((item) => !item.trim())) {
      return toast.error("Included and Excluded items cannot be empty. Please remove empty items.");
    }

    setLoading(true);
    try {
      const token = getClientCookie("session_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7009";

      const payload = {
        id: isEdit ? undefined : formId,
        name,
        category: finalCategory,
        provider_id: providerId,
        destination_id: destinationId || null,
        attraction_id: attractionId || null,
        location_label: locationLabel,
        short_description: shortDescription,
        overview: overview || null,
        highlights: highlightsText
          .split("\n")
          .map((h) => h.trim())
          .filter(Boolean),
        price_min: priceMin === "" ? null : Number(priceMin),
        price_max: priceMax === "" ? null : Number(priceMax),
        price_unit: priceUnit || null,
        price_note: priceNote || null,
        duration_label: durationLabel,
        max_guest_min: maxGuestMin === "" ? null : Number(maxGuestMin),
        max_guest_max: maxGuestMax === "" ? null : Number(maxGuestMax),
        meeting_point: meetingPoint || null,
        status,
        itinerary,
        rundown: rundown.map((item) => ({
          ...item,
          duration_minutes: item.duration_minutes ? Number(item.duration_minutes) : null,
        })),
        included,
        excluded,
        image,
        gallery,
      };

      const url = isEdit ? `${apiUrl}/api/v1/admin/programs/${initialData.id}` : `${apiUrl}/api/v1/admin/programs`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to save program");
      }

      toast.success(isEdit ? "Program updated successfully!" : "Program created successfully!");
      router.push("/dashboard/programs");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while saving the program";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const categoriesList = standardCategories;

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            {isEdit ? `Edit Program: ${initialData?.name}` : "Create Program"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Complete the program information, itinerary details, rundown sessions, and inclusions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/programs")} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 size-4" />
            {loading ? "Saving..." : "Save Program"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4 grid w-full max-w-3xl grid-cols-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary ({itinerary.length})</TabsTrigger>
          <TabsTrigger value="rundown">Rundown ({rundown.length})</TabsTrigger>
          <TabsTrigger value="inc-exc">Include/Exclude</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
              <CardDescription>Primary information about the tour program.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Program Name *</span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. surviving in the Analog Age"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Category *</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="custom">+ Custom Category...</option>
                  </select>
                  {category === "custom" && (
                    <Input
                      className="mt-1"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category name (e.g. Wellness Retreat)"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Provider *</span>
                  <select
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.legal_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Destination Mapping</span>
                  <select
                    value={destinationId}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">No specific destination</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Experience Mapping</span>
                  <select
                    value={attractionId}
                    onChange={(e) => setAttractionId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={!destinationId}
                  >
                    <option value="">Select an experience...</option>
                    {filteredAttractions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {!destinationId && (
                    <span className="text-[10px] text-muted-foreground">
                      Select a destination first to filter experiences.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Location Label *</span>
                  <Input
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                    placeholder="e.g. Sentul, Bogor or Bali"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Duration Label *</span>
                  <Input
                    value={durationLabel}
                    onChange={(e) => setDurationLabel(e.target.value)}
                    placeholder="e.g. 4-6 jam, Full Day, 2 Hari 1 Malam"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Short Description *</span>
                <Textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Provide a short description (1-2 sentences) for cards."
                  rows={2}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Program Overview</span>
                <Textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  placeholder="Detailed overview about what this program is about."
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Highlights (One per line)</span>
                <Textarea
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  placeholder="e.g. Learn traditional boat crafting&#10;Eco trekking in the national park"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Min Guest Capacity</span>
                  <Input
                    type="number"
                    value={maxGuestMin}
                    onChange={(e) => setMaxGuestMin(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 10"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Max Guest Capacity</span>
                  <Input
                    type="number"
                    value={maxGuestMax}
                    onChange={(e) => setMaxGuestMax(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Meeting Point</span>
                <Input
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="e.g. Lobby Hotel, Stasiun Bogor, etc."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRICING TAB */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
              <CardDescription>Configure price parameters or custom pricing notes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Minimum Price (IDR)</span>
                  <Input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 500000"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Maximum Price (IDR)</span>
                  <Input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 1500000 (Optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Price Unit (Note)</span>
                  <Input
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    placeholder="e.g. per pax, minimum 30 pax"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm">Price Note (For complex/by-quotation prices)</span>
                  <Input
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    placeholder="e.g. Mengikuti quotation resmi, hubungi admin"
                  />
                  <p className="text-muted-foreground text-xs">
                    Required if minimum and maximum price fields are left blank.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ITINERARY TAB */}
        <TabsContent value="itinerary">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Itinerary Stops</CardTitle>
                <CardDescription>Manage tour destinations, landmarks, and highlights.</CardDescription>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addItineraryStop}>
                <Plus className="mr-2 size-4" />
                Add Stop
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {itinerary.length === 0 ? (
                <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
                  No itinerary stops added yet. Click &quot;Add Stop&quot; to begin.
                </div>
              ) : (
                itinerary.map((stop, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: order is stable and index key is appropriate
                  <div key={index} className="flex items-start gap-4 rounded-lg border bg-muted/20 p-4">
                    <div className="mt-1 flex flex-col items-center gap-1">
                      <span className="mb-2 rounded-full bg-muted-foreground/20 px-2 py-0.5 font-bold text-xs">
                        {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={index === 0}
                        onClick={() => moveItinerary(index, "up")}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={index === itinerary.length - 1}
                        onClick={() => moveItinerary(index, "down")}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>

                    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-xs">Location / Stop Name *</span>
                        <Input
                          value={stop.location_name}
                          onChange={(e) => updateItineraryStop(index, "location_name", e.target.value)}
                          placeholder="e.g. Bukit Kingkong"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-xs">Unique Feature</span>
                        <Input
                          value={stop.unique_feature}
                          onChange={(e) => updateItineraryStop(index, "unique_feature", e.target.value)}
                          placeholder="e.g. Panorama 3 Gunung"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-xs">Activity & Challenge</span>
                        <Input
                          value={stop.activity_challenge}
                          onChange={(e) => updateItineraryStop(index, "activity_challenge", e.target.value)}
                          placeholder="e.g. Trekking & sunrise viewing"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => removeItineraryStop(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RUNDOWN TAB */}
        <TabsContent value="rundown">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rundown Schedule</CardTitle>
                <CardDescription>Setup chronological timeframe and session activities.</CardDescription>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addRundownItem}>
                <Plus className="mr-2 size-4" />
                Add Session
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {rundown.length === 0 ? (
                <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
                  No rundown items added yet. Click &quot;Add Session&quot; to begin.
                </div>
              ) : (
                rundown.map((item, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: order is stable and index key is appropriate
                  <div key={index} className="flex items-start gap-4 rounded-lg border bg-muted/20 p-4">
                    <div className="mt-1 flex flex-col items-center gap-1">
                      <span className="mb-2 rounded-full bg-muted-foreground/20 px-2 py-0.5 font-bold text-xs">
                        {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={index === 0}
                        onClick={() => moveRundown(index, "up")}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={index === rundown.length - 1}
                        onClick={() => moveRundown(index, "down")}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>

                    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <span className="font-semibold text-xs">Time Frame *</span>
                        <Input
                          value={item.time_label}
                          onChange={(e) => updateRundownItem(index, "time_label", e.target.value)}
                          placeholder="e.g. 08.00 - 08.30"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <span className="font-semibold text-xs">Duration (Min)</span>
                        <Input
                          type="number"
                          value={item.duration_minutes || ""}
                          onChange={(e) =>
                            updateRundownItem(
                              index,
                              "duration_minutes",
                              e.target.value === "" ? 0 : Number(e.target.value),
                            )
                          }
                          placeholder="e.g. 30"
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-3">
                        <span className="font-semibold text-xs">Session Activity *</span>
                        <Input
                          value={item.session_activity}
                          onChange={(e) => updateRundownItem(index, "session_activity", e.target.value)}
                          placeholder="e.g. Briefing & Ice Breaking"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <span className="font-semibold text-xs">Location</span>
                        <Input
                          value={item.location || ""}
                          onChange={(e) => updateRundownItem(index, "location", e.target.value)}
                          placeholder="e.g. Meeting point"
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-3">
                        <span className="font-semibold text-xs">Facilitator Notes</span>
                        <Input
                          value={item.facilitator_notes || ""}
                          onChange={(e) => updateRundownItem(index, "facilitator_notes", e.target.value)}
                          placeholder="e.g. Standby at entrance door"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => removeRundownItem(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INCLUDE EXCLUDE TAB */}
        <TabsContent value="inc-exc">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* INCLUDES */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pricing Includes</CardTitle>
                  <CardDescription>List items that are covered in the program price.</CardDescription>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addInclude}>
                  <Plus className="mr-2 size-4" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {included.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
                    No inclusions listed.
                  </div>
                ) : (
                  included.map((inc, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: simple text list requires index key
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={inc}
                        onChange={(e) => updateInclude(index, e.target.value)}
                        placeholder="e.g. Meals & coffee breaks"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-rose-500 hover:bg-rose-50"
                        onClick={() => removeInclude(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* EXCLUDES */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pricing Excludes</CardTitle>
                  <CardDescription>List items not covered (out-of-pocket costs).</CardDescription>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addExclude}>
                  <Plus className="mr-2 size-4" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {excluded.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground text-sm">
                    No exclusions listed.
                  </div>
                ) : (
                  excluded.map((exc, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: simple text list requires index key
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={exc}
                        onChange={(e) => updateExclude(index, e.target.value)}
                        placeholder="e.g. Flight ticket & personal expenses"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-rose-500 hover:bg-rose-50"
                        onClick={() => removeExclude(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Program Media</CardTitle>
              <CardDescription>Upload cover photo and gallery images for this tour program.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Cover Image</span>
                <ImageUploader value={image} onChange={setImage} ownerType="program" ownerId={formId} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-medium text-sm">Gallery Images</span>
                <ImageUploader value={gallery} onChange={setGallery} multiple ownerType="program" ownerId={formId} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
