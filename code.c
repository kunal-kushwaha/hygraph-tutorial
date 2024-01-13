#include<stdio.h>
#define macross 4

int main (void)
{
	int a = 2;
	#if macross == 2
		printf("%d \n",a);
	#else
		printf(" are u serious right now bro");
	#endif
	return 0;
}
