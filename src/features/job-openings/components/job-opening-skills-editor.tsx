"use client";

import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import { DeleteOutlined as RemoveIcon } from "@mui/icons-material";

import type { SkillResponse } from "@/features/skills/types/skills.types";
import {
  SKILL_PROFICIENCY_LABELS,
  SKILL_PROFICIENCY_LEVELS,
  type JobOpeningSkillInput,
  type SkillProficiencyLevel,
} from "@/features/job-openings/types/job-openings.types";

const DEFAULT_PROFICIENCY: SkillProficiencyLevel = "INTERMEDIATE";

function toOptionLabel(skill: SkillResponse) {
  return skill.code ? `${skill.name} (${skill.code})` : skill.name;
}

export interface JobOpeningSkillsEditorProps {
  options: SkillResponse[];
  value: JobOpeningSkillInput[];
  onChange: (value: JobOpeningSkillInput[]) => void;
  disabled?: boolean;
}

export function JobOpeningSkillsEditor({
  options,
  value,
  onChange,
  disabled,
}: JobOpeningSkillsEditorProps) {
  const optionsById = useMemo(() => {
    const map = new Map<string, SkillResponse>();
    for (const s of options) map.set(s.id, s);
    return map;
  }, [options]);

  const selectedOptions = useMemo(
    () => value.map((v) => optionsById.get(v.skill_id)).filter(Boolean) as SkillResponse[],
    [value, optionsById],
  );

  const updateSkill = (skillId: string, patch: Partial<JobOpeningSkillInput>) => {
    onChange(
      value.map((v) => (v.skill_id === skillId ? { ...v, ...patch } : v)),
    );
  };

  const removeSkill = (skillId: string) => {
    onChange(value.filter((v) => v.skill_id !== skillId));
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>Required Skills</Typography>
              <Typography variant="body2" color="text.secondary">
                Add skills and set proficiency, mandatory flag and experience.
              </Typography>
            </Box>
            <Chip
              size="small"
              label={`${value.length} selected`}
              sx={{ fontWeight: 800 }}
              variant="outlined"
            />
          </Stack>

          <Autocomplete
            multiple
            options={options}
            value={selectedOptions}
            disabled={disabled}
            getOptionLabel={toOptionLabel}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            onChange={(_e, nextSelected) => {
              const nextIds = new Set(nextSelected.map((s) => s.id));

              // keep existing for retained ids
              const retained = value.filter((v) => nextIds.has(v.skill_id));
              const retainedIds = new Set(retained.map((v) => v.skill_id));

              // add new selections with defaults
              const additions: JobOpeningSkillInput[] = nextSelected
                .filter((s) => !retainedIds.has(s.id))
                .map((s) => ({
                  skill_id: s.id,
                  proficiency_level: DEFAULT_PROFICIENCY,
                  is_mandatory: true,
                }));

              onChange([...retained, ...additions]);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Skills"
                placeholder={value.length === 0 ? "Search and select skills" : "Add more"}
              />
            )}
          />

          {value.length > 0 ? <Divider /> : null}

          <Stack spacing={1.5}>
            {value.map((v) => {
              const skill = optionsById.get(v.skill_id);
              const title = skill?.name ?? v.skill_id;
              const subtitle = skill?.code ? skill.code : undefined;

              return (
                <Card key={v.skill_id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800 }} noWrap>
                            {title}
                          </Typography>
                          {subtitle ? (
                            <Typography variant="caption" color="text.secondary">
                              {subtitle}
                            </Typography>
                          ) : null}
                        </Box>
                        <Tooltip title="Remove">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => removeSkill(v.skill_id)}
                              disabled={disabled}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <TextField
                          select
                          label="Proficiency"
                          value={v.proficiency_level}
                          onChange={(e) =>
                            updateSkill(v.skill_id, {
                              proficiency_level: e.target.value as SkillProficiencyLevel,
                            })
                          }
                          disabled={disabled}
                          sx={{ minWidth: 200 }}
                        >
                          {SKILL_PROFICIENCY_LEVELS.map((lvl) => (
                            <MenuItem key={lvl} value={lvl}>
                              {SKILL_PROFICIENCY_LABELS[lvl]}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          label="Years (optional)"
                          type="number"
                          value={v.years_of_experience_required ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            updateSkill(v.skill_id, {
                              years_of_experience_required:
                                raw === "" ? undefined : Number(raw),
                            });
                          }}
                          disabled={disabled}
                          sx={{ minWidth: 200 }}
                        />

                        <FormControlLabel
                          sx={{ ml: 0, alignSelf: { sm: "center" } }}
                          control={
                            <Switch
                              checked={v.is_mandatory ?? true}
                              onChange={(_e, checked) =>
                                updateSkill(v.skill_id, { is_mandatory: checked })
                              }
                              disabled={disabled}
                              color="success"
                            />
                          }
                          label={
                            <Typography sx={{ fontWeight: 700 }}>
                              {v.is_mandatory ?? true ? "Mandatory" : "Optional"}
                            </Typography>
                          }
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
