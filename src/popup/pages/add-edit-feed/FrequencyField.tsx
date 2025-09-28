import RadioGroup, {
  RadioGroupProps,
} from "@/popup/components/forms/RadioGroup";

export default function FrequencyField(props: FrequencyFieldProps) {
  const frequencies = [
    { label: "1 hour", value: 60 * 60 * 1000 },
    { label: "2 hours", value: 2 * 60 * 60 * 1000 },
    { label: "4 hours", value: 4 * 60 * 60 * 1000 },
    { label: "6 hours", value: 6 * 60 * 60 * 1000 },
    { label: "1 day", value: 24 * 60 * 60 * 1000 },
  ];

  return (
    <RadioGroup
      name="frequency"
      label="Update Frequency"
      options={frequencies}
      {...props}
    />
  );
}

type FrequencyFieldProps = Partial<RadioGroupProps>;
