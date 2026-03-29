"""This file imports a non-existent module — triggers ImportError at load time."""

import this_module_does_not_exist_xyz

def should_not_reach():
    return 42
