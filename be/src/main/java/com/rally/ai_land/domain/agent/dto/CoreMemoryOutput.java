package com.rally.ai_land.domain.agent.dto;

import lombok.Data;

@Data
public class CoreMemoryOutput {

    private final boolean isImportant;
    private final String memories;
}
