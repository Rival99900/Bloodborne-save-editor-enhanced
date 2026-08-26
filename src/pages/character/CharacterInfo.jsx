import Select from "../../components/Select";
import { useLocalization } from "../../i18n/localization";

function CharacterInfo({ editedStats, setEditedStats }) {
  const { t } = useLocalization();
  const voice = [
    { label: t("characterForm.voiceYoung"), value: 0 },
    { label: t("characterForm.voiceMature"), value: 1 },
    { label: t("characterForm.voiceAged"), value: 2 },
    { label: "Simon", value: 41 },
    { label: "Valtr", value: 40 },
    { label: "Brador", value: 42 },
    { label: "Annalise", value: 17 },
    { label: t("characterForm.voiceImposterDoctor"), value: 24 },
    { label: t("characterForm.voiceBigotedOldMan"), value: 25 },
    { label: t("characterForm.voiceLonelyOldWoman"), value: 26 },
    { label: t("characterForm.voiceBeggar"), value: 27 },
    { label: "Arianna", value: 28 },
    { label: "Adella", value: 32 },
    { label: "Alfred", value: 34 },
    { label: "Eileen", value: 35 },
    { label: "Djura", value: 33 },
    { label: "Micolash", value: 21 },
  ];
  const gender = [
    { label: t("characterForm.genderFemale"), value: 0 },
    { label: t("characterForm.genderMale"), value: 1 },
  ];
  const origins = [
    "originMilquetoast",
    "originLoneSurvivor",
    "originTroubledChildhood",
    "originViolentPast",
    "originProfessional",
    "originMilitaryVeteran",
    "originNobleScion",
    "originCruelFate",
    "originWasteOfSkin",
  ].map((key, value) => ({ label: t(`characterForm.${key}`), value }));
  const ng = Array.from({ length: 8 }, (_, value) => ({
    label: value === 0 ? "NG0" : `NG+${value}`,
    value,
  }));

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-evenly",
        marginTop: "5px",
      }}
    >
      <Select
        name="Gender"
        options={gender}
        setEditedStats={setEditedStats}
        editedStats={editedStats}
      />
      <Select
        name="Origin"
        options={origins}
        setEditedStats={setEditedStats}
        editedStats={editedStats}
      />
      <Select
        name="Voice"
        options={voice}
        setEditedStats={setEditedStats}
        editedStats={editedStats}
      />
      <Select
        name="Ng"
        options={ng}
        setEditedStats={setEditedStats}
        editedStats={editedStats}
      />
    </div>
  );
}

export default CharacterInfo;
