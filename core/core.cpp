/*=============================================================================
  Created by NxtChg (admin@nxtchg.com), 2018. License: Public Domain.
=============================================================================*/

//#define FINAL 1

#define IN_SIMCORE 1

#include "src/common.h"

#include "include/simcore.h"

#include "api.h"
//_____________________________________________________________________________

BOOL APIENTRY DllMain(HMODULE h, DWORD reason, LPVOID *reserved)
{
	switch(reason)
	{
		case DLL_PROCESS_ATTACH: DisableThreadLibraryCalls(h); break;
		case DLL_PROCESS_DETACH:                               break;
	}

	return TRUE;
}
