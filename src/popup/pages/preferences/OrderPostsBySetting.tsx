import RadioGroup, {
  RadioGroupProps,
} from "@/popup/components/forms/RadioGroup";

export default function OrderPostsBySetting(props: Partial<RadioGroupProps>) {
  const orderByOptions = [
    { label: "Published", value: "publishedAt" },
    { label: "Fetched by the extension", value: "fetchedAt" },
  ];

  return (
    <RadioGroup
      name="orderPostsBy"
      label="Order posts by when they were"
      options={orderByOptions}
      {...props}
    />
  );
}
